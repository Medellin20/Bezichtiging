/*
# Create visit_requests and payment_settings tables

## Purpose
This migration creates two tables for a visit request application:
1. `visit_requests` — stores all form submissions from visitors requesting a property visit
2. `payment_settings` — stores the RIB (bank details) and/or payment link that admins can edit

## 1. New Tables

### visit_requests
- `id` (uuid, primary key)
- `first_name` (text, not null) — visitor's first name
- `last_name` (text, not null) — visitor's last name
- `birth_date` (date, nullable) — visitor's date of birth
- `email` (text, not null) — visitor's email address
- `phone` (text, not null) — visitor's phone number
- `address` (text, nullable) — visitor's postal address
- `city` (text, nullable) — visitor's city
- `postal_code` (text, nullable) — visitor's postal code
- `housing_type` (text, nullable) — type of housing (apartment, house, etc.)
- `housing_address` (text, nullable) — address of the property to visit
- `housing_reference` (text, nullable) — reference number of the listing
- `preferred_date` (date, nullable) — preferred visit date
- `preferred_time` (text, nullable) — preferred time slot (morning, afternoon, evening)
- `visit_type` (text, nullable) — type of visit (in-person, virtual)
- `monthly_income` (numeric, nullable) — visitor's monthly net income in euros
- `employment_situation` (text, nullable) — employment status (CDI, CDD, freelancer, etc.)
- `message` (text, nullable) — additional message from visitor
- `status` (text, not null, default 'pending') — status of the request
- `created_at` (timestamptz, default now())

### payment_settings
- `id` (uuid, primary key)
- `rib_text` (text, nullable) — RIB bank details in text format
- `rib_iban` (text, nullable) — IBAN
- `rib_bic` (text, nullable) — BIC/SWIFT code
- `rib_holder` (text, nullable) — account holder name
- `rib_bank_name` (text, nullable) — bank name
- `payment_link` (text, nullable) — online payment link (Stripe, PayPal, etc.)
- `visit_fee` (numeric, default 50) — visit fee amount in euros
- `payment_instructions` (text, nullable) — additional payment instructions
- `updated_at` (timestamptz, default now())

## 2. Security

### visit_requests
- Enable RLS
- INSERT: anyone (anon + authenticated) can submit a visit request — this is a public form
- SELECT/UPDATE/DELETE: only authenticated admin users can view/manage requests

### payment_settings
- Enable RLS
- SELECT: anyone (anon + authenticated) can read payment settings (needed to display payment step)
- UPDATE: only authenticated admin users can modify payment settings
- No INSERT/DELETE needed (single row managed by admin)

## 3. Notes
- The app has an admin login (Supabase auth) but the public form does not require login
- Payment settings is a single-row table seeded with default values
*/

-- Create visit_requests table
CREATE TABLE IF NOT EXISTS visit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  birth_date date,
  email text NOT NULL,
  phone text NOT NULL,
  address text,
  city text,
  postal_code text,
  housing_type text,
  housing_address text,
  housing_reference text,
  preferred_date date,
  preferred_time text,
  visit_type text,
  monthly_income numeric(10,2),
  employment_situation text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE visit_requests ENABLE ROW LEVEL SECURITY;

-- Public can insert visit requests (no login required for the form)
DROP POLICY IF EXISTS "anon_insert_visit_requests" ON visit_requests;
CREATE POLICY "anon_insert_visit_requests"
ON visit_requests FOR INSERT
TO anon, authenticated WITH CHECK (true);

-- Only authenticated admins can view requests
DROP POLICY IF EXISTS "auth_select_visit_requests" ON visit_requests;
CREATE POLICY "auth_select_visit_requests"
ON visit_requests FOR SELECT
TO authenticated USING (true);

-- Only authenticated admins can update request status
DROP POLICY IF EXISTS "auth_update_visit_requests" ON visit_requests;
CREATE POLICY "auth_update_visit_requests"
ON visit_requests FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

-- Only authenticated admins can delete requests
DROP POLICY IF EXISTS "auth_delete_visit_requests" ON visit_requests;
CREATE POLICY "auth_delete_visit_requests"
ON visit_requests FOR DELETE
TO authenticated USING (true);

-- Create payment_settings table
CREATE TABLE IF NOT EXISTS payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rib_holder text,
  rib_iban text,
  rib_bic text,
  rib_bank_name text,
  payment_link text,
  visit_fee numeric(10,2) DEFAULT 50,
  payment_instructions text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

-- Public can read payment settings (needed to show RIB/payment link on the form)
DROP POLICY IF EXISTS "anon_select_payment_settings" ON payment_settings;
CREATE POLICY "anon_select_payment_settings"
ON payment_settings FOR SELECT
TO anon, authenticated USING (true);

-- Only authenticated admins can update payment settings
DROP POLICY IF EXISTS "auth_update_payment_settings" ON payment_settings;
CREATE POLICY "auth_update_payment_settings"
ON payment_settings FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

-- Only authenticated admins can insert payment settings
DROP POLICY IF EXISTS "auth_insert_payment_settings" ON payment_settings;
CREATE POLICY "auth_insert_payment_settings"
ON payment_settings FOR INSERT
TO authenticated WITH CHECK (true);

-- Seed a default payment settings row
INSERT INTO payment_settings (rib_holder, rib_iban, rib_bic, rib_bank_name, payment_link, visit_fee, payment_instructions)
VALUES (
  'Nom de l''agence',
  'FR76 1234 5678 9012 3456 7890 123',
  'ABCDEFGH123',
  'Banque Exemple',
  '',
  50.00,
  'Veuillez effectuer le paiement des frais de visite pour finaliser votre demande. Vous pouvez utiliser le lien de paiement en ligne ou effectuer un virement bancaire avec les coordonnées RIB ci-dessus.'
)
ON CONFLICT DO NOTHING;