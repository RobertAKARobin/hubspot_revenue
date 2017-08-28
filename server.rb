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

get "/mapping" do
	json(DBChange.refresh_mapping)
end

get "/refresh" do
	since_time = Deal.maximum("hs_lastmodifieddate").to_i * 1000
	output = {success: false}
	offset = 0
	starttime = Time.now
	loop do
		response = HTTParty.get("https://api.hubapi.com/deals/v1/deal/recent/modified", {
			query: {
				since: since_time,
				count: 100,
				hapikey: ENV['HAPIKEY'],
				offset: offset
			}
		})
		break unless response['hasMore']
		break if response.code >= 400
		offset = response['offset']
	end
	timediff = (Time.now - starttime)
	json({success: true, time: timediff})
end
