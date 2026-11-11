-- Store the listing URL attached to a visit request by the admin.
ALTER TABLE visit_requests
ADD COLUMN IF NOT EXISTS housing_link text;
