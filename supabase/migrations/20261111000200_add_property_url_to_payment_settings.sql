-- Store the active property listing URL with the public payment/form settings.
ALTER TABLE payment_settings
ADD COLUMN IF NOT EXISTS property_url text;
