class Refresh < ActiveRecord::Base
	before_validation do
		self.since_time = Time.at(self.since_time || 0).to_datetime
	end
end
