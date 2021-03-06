require "csv"
require "httparty"
require "active_support/time"

class Deal < ActiveRecord::Base
	@@mapping = nil
	@@timeline_parser = /[\$%]\d+\.?\d{0,2}*/
	self.primary_key = "dealId"

	before_save do
		if self.timeline_changed? || self.closedate_changed?
			self.projection_enddate = calculate_projection_enddate
		end
	end

	def attributes
		super.merge(projection: self.projection)
	end
	
	def self.mapping
		unless @@mapping
			@@mapping = self.refresh_mapping
		end
		return @@mapping
	end

	def self.refresh_mapping
		csv = CSV.read("./db/mapping.csv", {col_sep: "\t"})
		hashkeys = csv.shift
		mapping = {by_api_name: {}, all: []}
		csv.each do |line|
			next unless line[0] && line[1]
			entry = {datatype: line[0], apiname: line[1]}
			mapping[:by_api_name][line[1]] = entry
			mapping[:all].push(entry)
		end
		return mapping
	end

	def self.API_get_recently_modified(query = {})
		query[:hapikey] ||= ENV['HAPIKEY']
		query[:count] ||= 100
		query[:since] ||= (Time.now.to_i - 6000) * 1000
		query[:offset] ||= 0
		response = HTTParty.get("https://api.hubapi.com/deals/v1/deal/recent/modified", {query: query})
		return response
	end

	def self.create_from_API_records api_records
		api_records = [api_records] unless api_records.is_a? Array
		accepted_attributes = Deal.attribute_names
		results = {
			created_ids: [],
			updated_ids: []
		}
		api_records.each do |api_record|
			mapped_record = {
				dealId: api_record["dealId"]
			}
			api_record["properties"].each do |property_name, property_info|
				if accepted_attributes.include? property_name
					mapped_record[property_name] = property_info["value"]
				end
			end
			begin
				deal = Deal.create(mapped_record)
				results[:created_ids].push(deal[:dealId])
			rescue ActiveRecord::RecordNotUnique
				deal = Deal.find(mapped_record[:dealId])
				deal.update(mapped_record)
				results[:updated_ids].push(deal[:dealId])
			end
		end
		return results
	end

	def projection
		chunks = (self.read_attribute(:timeline) || "").scan(@@timeline_parser)
		chunks.map do |chunk|
			unit = chunk[0]
			amount = chunk[1..-1].to_f
			case unit
			when "$"
				dollars = amount
			when "%"
				dollars = ((amount / 100) * self.amount)
			end
			{
				unit: unit,
				raw: chunk,
				amount: amount,
				dollars: dollars
			}
		end
	end

	def calculate_projection_enddate
		startdate = Time.at(self.closedate / 1000).to_date
		enddate = startdate.advance(months: [projection.size, 1].max)
		return (enddate.strftime("%s").to_i * 1000)
	end

end
