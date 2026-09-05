import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Normalize Cakto payloads (they vary by event)
function normalize(payload: any) {
  const data = payload?.data || payload;
  const customer = data?.customer || data?.cliente || {};
  const transaction = data?.transaction || data?.transacao || data;

  // Map Cakto event/status into our buckets
  const rawEvent = String(payload?.event || payload?.type || data?.event || "").toLowerCase();
  const rawStatus = String(transaction?.status || data?.status || "").toLowerCase();

  let event_type = "unknown";
  let status = rawStatus || "unknown";
  if (rawEvent.includes("refund") || rawStatus.includes("refund") || rawStatus.includes("reembols")) {
    event_type = "refund"; status = "refunded";
  } else if (rawEvent.includes("paid") || rawStatus === "paid" || rawStatus === "approved" || rawStatus === "aprovado" || rawStatus === "pago") {
    event_type = "pix_paid"; status = "paid";
  } else if (rawEvent.includes("refused") || rawEvent.includes("declined") || rawStatus.includes("refus") || rawStatus.includes("declin")) {
    event_type = "payment_refused"; status = "refused";
  } else if (rawEvent.includes("pix") || rawEvent.includes("generated") || rawEvent.includes("pending") || rawStatus === "pending" || rawStatus === "waiting_payment") {
    event_type = "pix_generated"; status = "pending";
  }

  const amount = Number(
    transaction?.amount ?? transaction?.value ?? data?.amount ?? data?.value ?? data?.total ?? 0,
  );

  return {
    event_type,
    status,
    transaction_id: String(transaction?.id || transaction?.transaction_id || data?.id || "") || null,
    customer_name: customer?.name || customer?.nome || data?.customer_name || null,
    customer_email: customer?.email || data?.customer_email || null,
    customer_phone: customer?.phone || customer?.telefone || data?.customer_phone || null,
    amount: isFinite(amount) ? amount : 0,
    currency: (data?.currency || "BRL").toUpperCase(),
    payment_method: data?.payment_method || data?.method || "pix",
    occurred_at: data?.created_at || data?.paid_at || new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const row = normalize(payload);
  const { error } = await supabase.from("cakto_sales").insert({
    ...row,
    raw_payload: payload,
  });

  if (error) {
    console.error("[cakto-webhook] insert error", error);
    return json({ error: "insert_failed", detail: error.message }, 500);
  }

  // Relaciona o evento ao checkout mais recente do mesmo cliente.
  // A Cakto devolve o e-mail preenchido no checkout, sem expor a tabela ao navegador.
  if (row.customer_email && ["pending", "paid", "refused", "refunded"].includes(row.status)) {
    const normalizedEmail = String(row.customer_email).trim().toLowerCase();
    const { data: session } = await supabase
      .from("cakto_checkout_sessions")
      .select("id")
      .ilike("customer_email", normalizedEmail)
      .in("status", ["pending", "refused"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (session) {
      const { error: updateError } = await supabase
        .from("cakto_checkout_sessions")
        .update({
          status: row.status,
          cakto_transaction_id: row.transaction_id,
          occurred_at: row.occurred_at,
        })
        .eq("id", session.id);
      if (updateError) console.error("[cakto-webhook] session update error", updateError);
    }
  }

  // Forward purchase events to GA4 via Measurement Protocol (optional — only if creds set)
  const gaId = Deno.env.get("GA_MEASUREMENT_ID");
  const gaSecret = Deno.env.get("GA_API_SECRET");
  if (gaId && gaSecret && (row.event_type === "pix_paid" || row.event_type === "pix_generated")) {
    try {
      const eventName = row.event_type === "pix_paid" ? "purchase" : "generate_pix";
      await fetch(
        `https://www.google-analytics.com/mp/collect?measurement_id=${gaId}&api_secret=${gaSecret}`,
        {
          method: "POST",
          body: JSON.stringify({
            client_id: row.transaction_id || crypto.randomUUID(),
            events: [{
              name: eventName,
              params: {
                currency: row.currency,
                value: row.amount,
                transaction_id: row.transaction_id,
              },
            }],
          }),
        },
      );
    } catch (e) {
      console.error("[cakto-webhook] GA forward failed", e);
    }
  }

  return json({ ok: true, event: row.event_type });
});
