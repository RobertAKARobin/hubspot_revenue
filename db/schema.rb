require "./db/connection"

ActiveRecord::Schema.define do

	create_table "deals", force: true, id: false do |t|
		t.primary_key "deal_id"
		# "closed_won_reason"
		t.string "timeline"
		# "last_modified_date"
		# "pipeline"
		t.string "forecast_category"
		t.string "practice_labels"
		t.string "close_date"
		# "deal_type"
		# "project_manager"
		t.string "original_source_type"
		t.boolean "parking_lot"
		# "create_date"
		t.integer "probability_"
		# "eso_folder"
		# "closed_lost_reason"
		t.string "hubspot_owner"
		t.string "solutions_architect"
		# "last_activity_date"
		# "owner_assigned_date"
		# "specific_lead_source"
		t.string "deal_stage"
		# "number_of_contacts"
		# "original_source_data_1"
		# "original_source_data_2"
		# "hubspot_team"
		t.string "deal_name"
		t.float "amount"
		# "salesforce_opportunity_id"
		# "deal_description"
		# "last_salesforce_sync_time"
		# "reason_lost"
		t.string "lead_source_category"
		t.string "associated_company"
		# "associated_contacts"
		t.timestamps
	end

	create_table "db_changes", force: true do |t|
		t.string "change_type"
		t.integer "num_created"
		t.integer "num_updated"
		t.timestamps
	end

end
