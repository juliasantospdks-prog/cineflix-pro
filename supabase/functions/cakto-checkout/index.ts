import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";

const plans = {
  mensal: { name: "PLANO MENSAL", amount: 29.9, url: "https://pay.cakto.com.br/kmz4m8v_878535" },
  trimestral: { name: "PLANO TRIMESTRAL", amount: 75.9, url: "https://pay.cakto.com.br/3f3gp73_878540" },
  anual: { name: "PLANO ANUAL VIP", amount: 300, url: "https://pay.cakto.com.br/yxqbt2g_878541" },
} as const;

const CreateSchema = z.object({
  action: z.literal("create"),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  planId: z.enum(["mensal", "trimestral", "anual"]),
});

const StatusSchema = z.object({
  action: z.literal("status"),
  token: z.string().uuid(),
});

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const statusInput = StatusSchema.safeParse(body);
  if (statusInput.success) {
    const { data, error } = await supabase
      .from("cakto_checkout_sessions")
      .select("status,plan_name,amount,occurred_at")
      .eq("public_token", statusInput.data.token)
      .maybeSingle();
    if (error) return json({ error: "status_unavailable" }, 500);
    if (!data) return json({ error: "not_found" }, 404);
    return json(data);
  }

  const createInput = CreateSchema.safeParse(body);
  if (!createInput.success) {
    return json({ error: createInput.error.flatten().fieldErrors }, 400);
  }

  const plan = plans[createInput.data.planId];
  const email = createInput.data.email.toLowerCase();
  const checkout = new URL(plan.url);
  checkout.searchParams.set("name", createInput.data.name);
  checkout.searchParams.set("email", email);

  const { data, error } = await supabase
    .from("cakto_checkout_sessions")
    .insert({
      customer_name: createInput.data.name,
      customer_email: email,
      plan_id: createInput.data.planId,
      plan_name: plan.name,
      amount: plan.amount,
      checkout_url: checkout.toString(),
    })
    .select("public_token,status,plan_name,amount,checkout_url")
    .single();

  if (error || !data) {
    console.error("[cakto-checkout] create failed", error);
    return json({ error: "checkout_unavailable" }, 500);
  }

  return json({
    token: data.public_token,
    status: data.status,
    planName: data.plan_name,
    amount: data.amount,
    checkoutUrl: data.checkout_url,
  }, 201);
});