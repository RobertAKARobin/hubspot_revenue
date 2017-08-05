require "sinatra"
require "sinatra/reloader"
require "sinatra/json"
require "csv"

get "/" do
	redirect "/index.html"
end

get "/api" do
	json({success: true, message: "This is from the API"})
end

post "/upload" do
	data = []
	csv = CSV.parse(File.open(params[:file][:tempfile], "r").read)
	fields = csv.shift
	fields = fields.map do |field|
		field.downcase.gsub(/ /, "_").gsub(/[^a-z0-9_]/, "")
	end

	csv[0..9].each do |record|
		data.push Hash[fields.zip(record)]
	end
	data.to_json
end
