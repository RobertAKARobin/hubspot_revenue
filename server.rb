require "sinatra"
require "sinatra/reloader"
require "sinatra/json"
require "csv"

require "./db/connection"

get "/" do
	redirect "/index.html"
end

get "/api" do
	json({success: true, message: "This is from the API"})
end

post "/upload" do
	csv = CSV.parse(File.open(params[:file][:tempfile], "r").read)
	fields = csv.shift
	fields = fields.map do |field|
		field.downcase.gsub(/ /, "_").gsub(/[^a-z0-9_]/, "")
	end

	upload_batch = []
	csv[0..9].each do |record|
		upload_batch.push Hash[fields.zip(record)]
	end
	DB.deals.insert_many(upload_batch)
	json(DB.deals.find.to_a)
end

get "/wipe" do
	DB.deals.drop
	json(DB.deals.find.to_a)
end
