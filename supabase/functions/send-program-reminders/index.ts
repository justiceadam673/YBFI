import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get active programs that haven't started yet
    const today = new Date().toISOString().split("T")[0];
    const { data: programs, error: progError } = await supabase
      .from("programs")
      .select("id, title, start_date, location")
      .eq("is_active", true)
      .gt("start_date", today);

    if (progError) throw progError;
    if (!programs || programs.length === 0) {
      return new Response(JSON.stringify({ message: "No upcoming programs" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let totalSent = 0;

    for (const program of programs) {
      const { data: registrations, error: regError } = await supabase
        .from("program_registrations")
        .select("name, email")
        .eq("program_id", program.id);

      if (regError || !registrations || registrations.length === 0) continue;

      for (const reg of registrations) {
        const startFormatted = new Date(program.start_date).toLocaleDateString("en-US", {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
        });

        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
              .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
              .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 32px; text-align: center; }
              .header h1 { color: white; margin: 0; font-size: 24px; }
              .content { padding: 32px; }
              .content p { color: #64748b; line-height: 1.6; margin: 0 0 16px; }
              .detail-box { background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 0 8px 8px 0; margin: 16px 0; }
              .detail-label { font-weight: 600; color: #1e293b; }
              .detail-value { color: #64748b; }
              .footer { padding: 24px 32px; background: #f8fafc; text-align: center; color: #94a3b8; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📅 Program Reminder</h1>
              </div>
              <div class="content">
                <p>Hello ${reg.name}! 👋</p>
                <p>This is a friendly reminder that you are registered for an upcoming program:</p>
                <div class="detail-box">
                  <div class="detail-label">${program.title}</div>
                  <div class="detail-value">📅 Starts: ${startFormatted}</div>
                  ${program.location ? `<div class="detail-value">📍 Location: ${program.location}</div>` : ""}
                </div>
                <p>We look forward to seeing you there! 🙏</p>
              </div>
              <div class="footer">
                © ${new Date().getFullYear()} Young Builders Foundation International
              </div>
            </div>
          </body>
          </html>
        `;

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "YBFI <onboarding@resend.dev>",
            to: [reg.email],
            subject: `Reminder: ${program.title} is coming up!`,
            html,
          }),
        });

        if (res.ok) totalSent++;
        else console.error(`Failed to send to ${reg.email}:`, await res.text());
      }
    }

    console.log(`Sent ${totalSent} reminder emails`);
    return new Response(JSON.stringify({ sent: totalSent }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
