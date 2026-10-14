import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { requestId } = body;

    if (!requestId) {
      return new Response(
        JSON.stringify({ error: "Missing requestId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: request, error: fetchError } = await supabase
      .from("visit_requests")
      .select("*")
      .eq("id", requestId)
      .maybeSingle();

    if (fetchError || !request) {
      return new Response(
        JSON.stringify({ error: "Request not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: settings } = await supabase
      .from("payment_settings")
      .select("*")
      .maybeSingle();

    const emailBody = `
Nouvelle demande de visite

INFORMATIONS PERSONNELLES
- Nom: ${request.first_name} ${request.last_name}
- Date de naissance: ${request.birth_date || "Non renseignée"}
- Email: ${request.email}
- Telephone: ${request.phone}
- Adresse: ${request.address || "Non renseignée"}, ${request.city || ""} ${request.postal_code || ""}

LOGEMENT CONCERNE
- Type: ${request.housing_type || "Non renseigne"}
- Adresse: ${request.housing_address || "Non renseignee"}
- Reference: ${request.housing_reference || "Non renseignee"}

PREFERENCES DE VISITE
- Date preferee: ${request.preferred_date || "Non renseignee"}
- Creneau: ${request.preferred_time || "Non renseigne"}
- Type de visite: ${request.visit_type || "Non renseigne"}

PROJET DE LOCATION
- Revenu mensuel net: ${request.monthly_income ? request.monthly_income + " EUR" : "Non renseigne"}
- Situation professionnelle: ${request.employment_situation || "Non renseignee"}

MESSAGE
${request.message || "Aucun message"}

FRAIS DE VISITE
${settings ? settings.visit_fee + " EUR" : "Non configure"}

Date de la demande: ${new Date(request.created_at).toLocaleString("fr-FR")}
    `.trim();

    console.log("Visit request notification:");
    console.log(emailBody);

    return new Response(
      JSON.stringify({ success: true, message: "Notification processed" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
