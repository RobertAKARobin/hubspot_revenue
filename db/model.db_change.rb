require "csv"

class DBChange < ActiveRecord::Base

	@@mapping = nil

	def self.mapping
		unless @@mapping
			@@mapping = self.refresh_mapping
		end
		return @@mapping
	end

	private
	def self.refresh_mapping
		csv = CSV.read("./db/mapping.csv", {col_sep: "\t"})
		hashkeys = csv.shift
		mapping = {by_csvname: {}, by_apiname: {}, all: []}
		csv.each do |line|
			next unless line[0] && line[1] && line[2]
			entry = {datatype: line[0], csvname: line[1], apiname: line[2]}
			mapping[:by_csvname][line[1]] = entry
			mapping[:by_apiname][line[1]] = entry
			mapping[:all].push(entry)
		end
		return mapping
	end
end
