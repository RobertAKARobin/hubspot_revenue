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

post "/upload" do
	csv_file = params[:file][:tempfile]

	num_updated = 0
	num_created = 0
	new_deals = []
	csv_columns = []
	File.open(csv_file, "r") do |csv|
		csv.each_line.with_index do |line, line_num|
			line = CSV.parse(line)[0]
			if line_num == 0 then
				csv_columns = line
				next
			elsif line_num >= 10 then
				break
			else
				data = {}
				csv_columns.each_with_index do |csv_column, index|
					db_column = DBChange.mapping[:by_csvname][csv_column]
					if db_column
						data[db_column[:apiname]] = line[index]
					end
				end
				if Deal.exists?(data["dealId"])
					Deal.find(data["dealId"]).update(data)
					num_updated += 1
				else
					Deal.create(data)
					num_created += 1
				end
			end
		end
	end
	DBChange.create({change_type: "upload_csv", num_updated: num_updated, num_created: num_created})

	json({history: DBChange.all.map, deals: Deal.all})
end

get "/fetch" do
	since_time = Deal.maximum("hs_lastmodifieddate").to_i * 1000
	response = HTTParty.get("https://api.hubapi.com/deals/v1/deal/recent/modified?since=#{since_time}&hapikey=#{ENV['HAPIKEY']}")
	json response
end
