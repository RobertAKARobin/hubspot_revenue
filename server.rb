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
	json(Deal.all)
end

get "/refreshes/all" do
	json(Refresh.all)
end

get "/refresh" do
	content_type "text/event-stream"
	refresh_info = {
		since_time: Refresh.maximum("created_at"),
		num_created: 0,
		num_updated: 0
	}
	stream do |out|
		offset = 0
		begin
			loop do
				response = Deal.API_get_recently_modified({
					since_time: (refresh_info[:since_time] || 0).to_i * 1000,
					count: 10,
					offset: offset
				})
				if response.code >= 400
					fail 'Bad request; try again'
				else
					result = Deal.create_from_API_records(response["results"])
					offset = response['offset']
					out << "data: #{JSON.generate({
						success: true,
						offset: response['offset'],
						total: response['total']
					})}\n\n"
					refresh_info[:num_created] += result[:created_ids].size
					refresh_info[:num_updated] += result[:updated_ids].size
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
		end
	end
end
