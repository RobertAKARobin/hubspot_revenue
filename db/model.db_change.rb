require "csv"

class DBChange < ActiveRecord::Base

	@@mapping = nil

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
end
