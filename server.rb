require "dotenv/load"
require "sinatra"
require "sinatra/reloader"
require "sinatra/json"
require "csv"

require "./db/connection"
require "./db/model.deal"
require "./db/model.db_change"

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
	input_fields = []
	db_fields = Deal.attribute_names
	File.open(csv_file, "r") do |csv|
		csv.each_line.with_index do |line, line_num|
			line = CSV.parse(line)[0]
			if line_num == 0
				input_fields = line.map do |field|
					field.downcase.gsub(/ /, "_").gsub(/[^a-z0-9_]/, "")
				end
				next
			elsif line_num >= 10 then
				break
			else
				data = {}
				db_fields.each do |field|
					index = input_fields.index(field)
					data[field] = line[index] if index
				end
				if Deal.exists?(data["deal_id"])
					Deal.find(data["deal_id"]).update(data)
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

get "/env" do
	json ENV
end
