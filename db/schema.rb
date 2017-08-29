require "./db/connection"
require "./db/model.deal.rb"

ActiveRecord::Schema.define do

	create_table "deals", force: true, id: false do |t|
		Deal.mapping[:all].each do |property|
			t.send(property[:datatype], property[:apiname])
		end
	end

	create_table "db_changes", force: true do |t|
		t.string "change_type"
		t.integer "num_created"
		t.integer "num_updated"
		t.timestamps
	end

end
