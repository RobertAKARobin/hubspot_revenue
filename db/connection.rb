require "mongo"

module DB
	@connection = Mongo::Client.new("mongodb://127.0.0.1:27017/hubspot_revenue")

	def self.deals
		@connection[:deals]
	end
end
