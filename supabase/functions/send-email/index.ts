// supabase/functions/send-email/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  clientFirstName: string
  clientLastName: string
  clientEmail: string
  clientPhone?: string
  appointmentDate: string
  appointmentTime: string
  motif?: string
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Récupérer les variables d'environnement
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL')
    const APP_NAME = Deno.env.get('APP_NAME') || 'Grapho'

    if (!RESEND_API_KEY || !ADMIN_EMAIL) {
      throw new Error('Configuration manquante: RESEND_API_KEY ou ADMIN_EMAIL')
    }

    // Parser les données de la requête
    const emailData: EmailRequest = await req.json()

    // Générer le HTML de l'email
    const htmlContent = generateEmailHTML(emailData, APP_NAME)

    // Envoyer l'email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${APP_NAME} <onboarding@resend.dev>`,
        to: [ADMIN_EMAIL],
        subject: `🔔 Nouveau rendez-vous - ${emailData.clientFirstName} ${emailData.clientLastName}`,
        html: htmlContent,
      }),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('❌ Erreur Resend:', resendData)
      throw new Error(`Resend API error: ${JSON.stringify(resendData)}`)
    }

    console.log('✅ Email envoyé avec succès:', resendData)

    return new Response(
      JSON.stringify({ success: true, data: resendData }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (err: unknown) {
    const error = err as Error
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error)
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

function generateEmailHTML(data: EmailRequest, appName: string): string {
  const motifSection = data.motif 
    ? `<p style="margin: 8px 0; color: #6b7280;"><strong>Motif :</strong> ${data.motif}</p>`
    : ''

  const phoneSection = data.clientPhone
    ? `<p style="margin: 8px 0; color: #6b7280;"><strong>Téléphone :</strong> ${data.clientPhone}</p>`
    : ''

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 32px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                      🔔 Nouveau Rendez-vous
                    </h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 32px;">
                    
                    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                      Un nouveau client vient de prendre un premier rendez-vous via la page contact.
                    </p>

                    <!-- Client Info Box -->
                    <div style="background-color: #f3f4f6; border-left: 4px solid #667eea; padding: 20px; margin: 24px 0; border-radius: 4px;">
                      <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 18px; font-weight: 600;">
                        👤 Informations du client
                      </h2>
                      <p style="margin: 8px 0; color: #6b7280;"><strong>Nom :</strong> ${data.clientFirstName} ${data.clientLastName}</p>
                      <p style="margin: 8px 0; color: #6b7280;"><strong>Email :</strong> ${data.clientEmail}</p>
                      ${phoneSection}
                    </div>

                    <!-- Appointment Info Box -->
                    <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 4px;">
                      <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 18px; font-weight: 600;">
                        📅 Détails du rendez-vous
                      </h2>
                      <p style="margin: 8px 0; color: #6b7280;"><strong>Date :</strong> ${data.appointmentDate}</p>
                      <p style="margin: 8px 0; color: #6b7280;"><strong>Heure :</strong> ${data.appointmentTime}</p>
                      ${motifSection}
                    </div>

                    <!-- Call to Action -->
                    <div style="text-align: center; margin: 32px 0;">
                      <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px;">
                        Connectez-vous à votre tableau de bord pour gérer ce rendez-vous
                      </p>
                    </div>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 24px 32px; border-radius: 0 0 8px 8px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                      Cet email a été envoyé automatiquement par <strong>${appName}</strong>
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}