export interface VisitRequest {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  email: string;
  phone: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  housing_type: string | null;
  housing_address: string | null;
  housing_reference: string | null;
  housing_link: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  visit_type: string | null;
  monthly_income: number | null;
  employment_situation: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

export interface PaymentSettings {
  id: string;
  rib_holder: string | null;
  rib_iban: string | null;
  rib_bic: string | null;
  rib_bank_name: string | null;
  payment_link: string | null;
  show_rib: boolean;
  show_payment_link: boolean;
  visit_fee: number;
  payment_instructions: string | null;
  updated_at: string;
}

export interface VisitRequestInput {
  first_name: string;
  last_name: string;
  birth_date: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  housing_type: string;
  housing_address: string;
  housing_reference: string;
  housing_link: string;
  preferred_date: string;
  preferred_time: string;
  visit_type: string;
  monthly_income: string;
  employment_situation: string;
  message: string;
}
