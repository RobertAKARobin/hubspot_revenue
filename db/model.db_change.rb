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
		mapping = {csvname: {}, varname: {}}
		csv.each do |line|
			next unless line[0] && line[1] && line[2]
			entry = {datatype: line[0], csvname: line[1], varname: line[2]}
			mapping[:csvname][line[1]] = entry
			mapping[:varname][line[1]] = entry
		end
		return mapping
	end
end
