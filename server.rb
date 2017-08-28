require "dotenv/load"
require "sinatra"
require "sinatra/reloader" if development?
require "sinatra/json"
require "csv"
require "httparty"

require "./db/connection"
require "./db/model.deal"
require "./db/model.db_change"

configure :development do |config|
  config.also_reload "./db/model.*.rb"
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

get "/refresh" do
	content_type "text/event-stream"
	stream do |out|
		# since_time = Deal.maximum("hs_lastmodifieddate").to_i * 1000
		since_time = (Time.now.to_i - 6000) * 1000
		offset = 0
		begin
			loop do
				response = HTTParty.get("https://api.hubapi.com/deals/v1/deal/recent/modified", {
					query: {
						since: since_time,
						count: 10,
						hapikey: ENV['HAPIKEY'],
						offset: offset
					}
				})
				fail 'Bad request; try again' if response.code >= 400
				offset = response['offset']
				out << "data: #{JSON.generate({
					success: true,
					offset: response['offset'],
					total: response['total']
				})}\n\n"
				break unless response['hasMore']
			end
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
