require "./db/connection"
require "./db/model.deal.rb"

ActiveRecord::Schema.define do

	create_table "deals", force: true, id: false do |t|
		Deal.mapping[:all].each do |property|
			t.send(property[:datatype], property[:apiname])
		end
		t.bigint "projection_enddate"
	end

	create_table "refreshes", force: true do |t|
		t.bigint "since_time"
		t.integer "num_created"
		t.integer "num_updated"
		t.timestamps
	end

end
