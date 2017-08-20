require "./db/connection"

ActiveRecord::Schema.define do

# 	"deal_id",
# "closed_won_reason",
# "timeline",
# "last_modified_date",
# "pipeline",
# "forecast_category",
# "practice_labels",
# "close_date",
# "deal_type",
# "project_manager",
# "original_source_type",
# "parking_lot",
# "create_date",
# "probability_",
# "eso_folder",
# "closed_lost_reason",
# "hubspot_owner",
# "solutions_architect",
# "last_activity_date",
# "owner_assigned_date",
# "specific_lead_source",
# "deal_stage",
# "number_of_contacts",
# "original_source_data_1",
# "original_source_data_2",
# "hubspot_team",
# "deal_name",
# "amount",
# "salesforce_opportunity_id",
# "deal_description",
# "last_salesforce_sync_time",
# "reason_lost",
# "lead_source_category",
# "associated_company",
# "associated_contacts"

	create_table "deals", force: true, id: false do |t|
		t.primary_key "deal_id"
		t.timestamps
	end

end
