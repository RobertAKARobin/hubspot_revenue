require "dotenv/load"
require "sinatra"
require "sinatra/reloader" if development?
require "sinatra/json"
require "date"
require "active_support/time"
require "pry"

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

get "/delete" do
	Deal.delete_all
	Refresh.delete_all
	json Deal.all
end

get "/deals" do
	filter = (params[:filter] || {})

	filter[:projection_start_year] ||= Date.today.year
	filter[:projection_start_month] ||= Date.today.month
	filter[:projection_month_range] ||= 1
	projection_startdate = Date.new(filter[:projection_start_year].to_i, filter[:projection_start_month].to_i + 1)
	projection_enddate = projection_startdate.advance(months: filter[:projection_month_range].to_i)
	filter[:projection_startdate] = projection_startdate.strftime("%s").to_i * 1000
	filter[:projection_enddate] = projection_enddate.strftime("%s").to_i * 1000

	probability_range = [(filter[:probability_low] || 50).to_i, (filter[:probability_high] || 100).to_i].sort
	filter[:probability_low] = probability_range[0]
	filter[:probability_high] = probability_range[1]

	sql = ("SELECT * FROM deals WHERE ((#{filter[:projection_startdate]} BETWEEN closedate AND projection_enddate) OR (#{filter[:projection_enddate]} BETWEEN closedate AND projection_enddate)) AND (probability_ BETWEEN #{filter[:probability_low]} AND #{filter[:probability_high]}) ORDER BY probability_ desc")
	deals = Deal.find_by_sql(sql)
	begin
		json({success: true, filter: filter, sql: sql, deals: deals})
	rescue Exception => error
		json({success: false, message: error.message})
	end
end

patch "/deals/:dealId" do
	begin
		deal = Deal.find(params[:dealId])
		data = JSON.parse(request.body.read)
		deal.update(timeline: data["timeline"])
		json({success: true, deal: deal})
	rescue Exception => error
		json({success: false, message: error})
	end
end

get "/refreshes" do
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
