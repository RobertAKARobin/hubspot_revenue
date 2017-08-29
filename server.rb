require "dotenv/load"
require "sinatra"
require "sinatra/reloader" if development?
require "sinatra/json"

require "./db/connection"
require "./db/model.deal"
require "./db/model.db_change"

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
	DBChange.delete_all
	json Deal.all
end

get "/all" do
	json(Deal.all)
end

get "/refresh" do
	content_type "text/event-stream"
	since_time = Deal.maximum("hs_lastmodifieddate").to_i * 1000
	results = {
		success: true,
		since_time: since_time,
		created_ids: [],
		updated_ids: []
	}
	stream do |out|
		offset = 0
		begin
			loop do
				response = Deal.API_get_recently_modified({
					since_time: since_time,
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
					results[:created_ids].concat(result[:created_ids])
					results[:updated_ids].concat(result[:updated_ids])
					break unless response['hasMore']
				end
			end
			out << "data: #{JSON.generate(results)}\n\n"
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
