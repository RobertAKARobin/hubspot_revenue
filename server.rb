require "dotenv/load"
require "sinatra"
require "sinatra/reloader" if development?
require "sinatra/json"
require "date"

require "./db/connection"
require "./db/model.deal"
require "./db/model.refresh"

configure :development do |config|
	config.also_reload "./db/model.*.rb"
end

after do
	ActiveRecord::Base.connection.close
end

get "/" do
	redirect "/index.html"
end

get "/api" do
	json({success: true, message: "This is from the API"})
end

get "/delete" do
	Deal.delete_all
	Refresh.delete_all
	json Deal.all
end

get "/deals/all" do
	json({success: true, deals: Deal.order(hs_lastmodifieddate: :desc).first(20)})
end

post "/deals/:dealId" do
	begin
		deal = Deal.find(params[:dealId])
		data = JSON.parse(request.body.read)
		deal.update(timeline: data["timeline"])
		json({success: true, deal: deal})
	rescue
		json({success: false})
	end
end

get "/refreshes/all" do
	json(Refresh.all)
end

get "/refresh" do
	content_type "text/event-stream"
	refresh_info = {
		since_time: Refresh.maximum("created_at").to_i,
		num_created: 0,
		num_updated: 0
	}
	offset = 0
	stream do |out|
		begin
			loop do
				response = Deal.API_get_recently_modified({
					since: (refresh_info[:since_time] || 0) * 1000,
					count: 100,
					offset: offset
				})
				if response.code >= 400
					fail 'Bad request; try again'
				else
					offset = response['offset']
					results = Deal.create_from_API_records(response["results"])
					out << "data: #{JSON.generate({
						success: true,
						offset: response['offset'],
						total: response['total']
					})}\n\n"
					refresh_info[:num_created] += results[:created_ids].size
					refresh_info[:num_updated] += results[:updated_ids].size
					break unless response['hasMore']
				end
			end
			out << "data: #{JSON.generate({
				success: true,
				refresh_info: Refresh.create(refresh_info).as_json
			})}\n\n"
		rescue StandardError => message
			status 400
			out << "data: #{JSON.generate({
				success: false,
				message: message
			})}\n\n"
		ensure
			out << "data: CLOSE\n\n"
			out.close
			ActiveRecord::Base.clear_active_connections!
		end
	end
end
