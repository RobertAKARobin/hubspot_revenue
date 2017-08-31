require "./db/connection"
require "./db/model.deal.rb"

ActiveRecord::Schema.define do

	create_table "deals", force: true, id: false do |t|
		Deal.mapping[:all].each do |property|
			t.send(property[:datatype], property[:apiname])
		end
		t.integer "projection_months"
	end

	create_table "revchunk", force: true do |t|
		t.bigint "month_unix"
		t.references "deal", index: true
		t.integer "amount"
		t.timestamps
	end

	create_table "refreshes", force: true do |t|
		t.bigint "since_time"
		t.integer "num_created"
		t.integer "num_updated"
		t.timestamps
	end

end
