import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "welcome" | "admin_action" | "registration_report";
  to: string;
  data: {
    userName?: string;
    actionType?: string;
    actionDetails?: string;
    performedBy?: string;
    programTitle?: string;
    registrations?: Array<{
      name: string;
      email: string;
      phone: string;
      gender: string;
      denomination: string | null;
      special_request: string | null;
      created_at: string;
    }>;
  };
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Email notification function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { type, to, data }: EmailRequest = await req.json();
    console.log(`Sending ${type} email to ${to}`);

    let subject: string;
    let html: string;

    if (type === "welcome") {
      subject = "Welcome to YBFI - Young Builders Foundation International!";
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #f59e0b 100%); padding: 40px 32px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0; }
            .content { padding: 40px 32px; }
            .content h2 { color: #1e293b; margin: 0 0 16px; }
            .content p { color: #64748b; line-height: 1.6; margin: 0 0 16px; }
            .button { display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-top: 16px; }
            .footer { padding: 24px 32px; background: #f8fafc; text-align: center; color: #94a3b8; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to YBFI!</h1>
              <p>Young Builders Foundation International</p>
            </div>
            <div class="content">
              <h2>Hello ${data.userName || "Beloved"}! 🙏</h2>
              <p>We're thrilled to have you join our community of believers. At YBFI, we're committed to building believers through the Word of Faith and the Release of the Supernatural.</p>
              <p>Explore our platform to access messages, books, prayer requests, and our AI-powered GospelBuddy to help you grow in faith!</p>
              <a href="https://youngbuilders.lovable.app" class="button">Visit YBFI</a>
            </div>
            <div class="footer">
              © ${new Date().getFullYear()} Young Builders Foundation International. All rights reserved.
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (type === "admin_action") {
      subject = `YBFI Admin Action: ${data.actionType}`;
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
            .header { background: #1e293b; padding: 32px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { padding: 32px; }
            .content p { color: #64748b; line-height: 1.6; margin: 0 0 16px; }
            .action-box { background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 0 8px 8px 0; margin: 16px 0; }
            .action-type { font-weight: 600; color: #1e293b; margin-bottom: 8px; }
            .action-details { color: #64748b; font-size: 14px; }
            .footer { padding: 24px 32px; background: #f8fafc; text-align: center; color: #94a3b8; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 Admin Notification</h1>
            </div>
            <div class="content">
              <p>An admin action has been performed on YBFI:</p>
              <div class="action-box">
                <div class="action-type">${data.actionType}</div>
                <div class="action-details">${data.actionDetails || 'No additional details'}</div>
              </div>
              <p style="font-size: 14px; color: #94a3b8;">Performed by: ${data.performedBy || 'System'}<br>Time: ${new Date().toLocaleString()}</p>
            </div>
            <div class="footer">
              © ${new Date().getFullYear()} Young Builders Foundation International
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (type === "registration_report") {
      const regs = data.registrations || [];
      subject = `Registration Report: ${data.programTitle || "Program"}`;
      const tableRows = regs.map((r: any) => `
        <tr>
          <td style="border:1px solid #e2e8f0;padding:8px;">${r.name}</td>
          <td style="border:1px solid #e2e8f0;padding:8px;">${r.email}</td>
          <td style="border:1px solid #e2e8f0;padding:8px;">${r.phone}</td>
          <td style="border:1px solid #e2e8f0;padding:8px;">${r.gender}</td>
          <td style="border:1px solid #e2e8f0;padding:8px;">${r.denomination || '-'}</td>
          <td style="border:1px solid #e2e8f0;padding:8px;">${r.special_request || '-'}</td>
          <td style="border:1px solid #e2e8f0;padding:8px;">${new Date(r.created_at).toLocaleDateString()}</td>
        </tr>
      `).join("");
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
            .container { max-width: 800px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 32px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { padding: 32px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 10px 8px; text-align: left; font-weight: 600; }
            .footer { padding: 24px 32px; background: #f8fafc; text-align: center; color: #94a3b8; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 ${data.programTitle} - Registrations (${regs.length})</h1>
            </div>
            <div class="content">
              <table>
                <thead>
                  <tr>
                    <th>Name</th><th>Email</th><th>Phone</th><th>Gender</th><th>Denomination</th><th>Special Request</th><th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows || '<tr><td colspan="7" style="text-align:center;padding:20px;">No registrations yet.</td></tr>'}
                </tbody>
              </table>
            </div>
            <div class="footer">
              © ${new Date().getFullYear()} Young Builders Foundation International
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      throw new Error("Invalid email type");
    }

    // Send email using Resend API directly
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "YBFI <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Resend API error:", errorData);
      throw new Error(errorData.message || "Failed to send email");
    }

    const emailResponse = await response.json();
    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
