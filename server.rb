require "sinatra"
require "sinatra/reloader"
require "sinatra/json"

get "/" do
	redirect "/index.html"
end

get "/api" do
	json({success: true, message: "This is from the API"})
end
