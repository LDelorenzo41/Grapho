import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Types de requêtes supportées
type EmailType = 'new_appointment' | 'contact_form' | 'appointment_cancelled'

interface BaseEmailRequest {
  type: EmailType
}

interface NewAppointmentRequest extends BaseEmailRequest {
  type: 'new_appointment'
  clientFirstName: string
  clientLastName: string
  clientEmail: string
  clientPhone?: string
  appointmentDate: string
  appointmentTime: string
  appointmentType?: string
  appointmentDuration?: number
}

interface ContactFormRequest extends BaseEmailRequest {
  type: 'contact_form'
  name: string
  email: string
  phone?: string
  message: string
}

interface AppointmentCancelledRequest extends BaseEmailRequest {
  type: 'appointment_cancelled'
  clientFirstName: string
  clientLastName: string
  clientEmail: string
  appointmentDate: string
  appointmentTime: string
  cancelledBy: 'client' | 'admin'
}

type EmailRequest = NewAppointmentRequest | ContactFormRequest | AppointmentCancelledRequest

// Pour la rétrocompatibilité avec l'ancien format
interface LegacyAppointmentRequest {
  clientFirstName: string
  clientLastName: string
  clientEmail: string
  clientPhone?: string
  appointmentDate: string
  appointmentTime: string
  motif?: string
}

serve(async (req: Request) => {
  console.log('🚀 Requête reçue')
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Charger les secrets
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL')
    const APP_NAME = Deno.env.get('APP_NAME') || 'Grapho'
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'onboarding@resend.dev'
    const APP_URL = Deno.env.get('APP_URL') || 'https://grapho.fr'

    if (!RESEND_API_KEY || !ADMIN_EMAIL) {
      console.error('❌ Secrets manquants')
      throw new Error('Configuration Supabase incorrecte. Vérifiez les secrets RESEND_API_KEY et ADMIN_EMAIL.')
    }

    console.log('✅ Secrets chargés')

    const requestData = await req.json()
    
    // Déterminer le type de requête (rétrocompatibilité)
    let emailRequest: EmailRequest
    if (!requestData.type && requestData.clientFirstName) {
      // Ancien format - convertir en nouveau
      const legacy = requestData as LegacyAppointmentRequest
      emailRequest = {
        type: 'new_appointment',
        clientFirstName: legacy.clientFirstName,
        clientLastName: legacy.clientLastName,
        clientEmail: legacy.clientEmail,
        clientPhone: legacy.clientPhone,
        appointmentDate: legacy.appointmentDate,
        appointmentTime: legacy.appointmentTime,
        appointmentType: legacy.motif || 'Premier rendez-vous',
      }
    } else {
      emailRequest = requestData as EmailRequest
    }

    const results: { admin?: boolean; client?: boolean } = {}

    // Traiter selon le type
    switch (emailRequest.type) {
      case 'new_appointment':
        results.admin = await sendAdminNewAppointmentEmail(
          emailRequest,
          RESEND_API_KEY,
          ADMIN_EMAIL,
          APP_NAME,
          FROM_EMAIL
        )
        results.client = await sendClientConfirmationEmail(
          emailRequest,
          RESEND_API_KEY,
          APP_NAME,
          FROM_EMAIL,
          APP_URL
        )
        break

      case 'contact_form':
        results.admin = await sendContactFormEmail(
          emailRequest,
          RESEND_API_KEY,
          ADMIN_EMAIL,
          APP_NAME,
          FROM_EMAIL
        )
        results.client = await sendContactFormAcknowledgement(
          emailRequest,
          RESEND_API_KEY,
          APP_NAME,
          FROM_EMAIL
        )
        break

      case 'appointment_cancelled':
        results.admin = await sendCancellationNotificationAdmin(
          emailRequest,
          RESEND_API_KEY,
          ADMIN_EMAIL,
          APP_NAME,
          FROM_EMAIL
        )
        results.client = await sendCancellationConfirmationClient(
          emailRequest,
          RESEND_API_KEY,
          APP_NAME,
          FROM_EMAIL
        )
        break

      default:
        throw new Error('Type d\'email non reconnu')
    }

    console.log('✅ Emails envoyés:', results)

    return new Response(
      JSON.stringify({ success: true, results }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (err: unknown) {
    const error = err as Error
    console.error('❌ Erreur:', error.message)
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

// ============================================================================
// FONCTIONS D'ENVOI D'EMAILS
// ============================================================================

async function sendEmail(
  apiKey: string,
  from: string,
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Erreur Resend:', data)
      return false
    }

    console.log('✅ Email envoyé à:', to)
    return true
  } catch (error) {
    console.error('❌ Erreur envoi email:', error)
    return false
  }
}

// ============================================================================
// EMAILS NOUVEAU RENDEZ-VOUS
// ============================================================================

async function sendAdminNewAppointmentEmail(
  data: NewAppointmentRequest,
  apiKey: string,
  adminEmail: string,
  appName: string,
  fromEmail: string
): Promise<boolean> {
  const phoneSection = data.clientPhone
    ? `<p style="margin: 8px 0; color: #6b7280;"><strong>Téléphone :</strong> ${data.clientPhone}</p>`
    : ''

  const typeSection = data.appointmentType
    ? `<p style="margin: 8px 0; color: #6b7280;"><strong>Type :</strong> ${data.appointmentType}</p>`
    : ''

  const durationSection = data.appointmentDuration
    ? `<p style="margin: 8px 0; color: #6b7280;"><strong>Durée :</strong> ${data.appointmentDuration} minutes</p>`
    : ''

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background: linear-gradient(135deg, #8FA382 0%, #6B8E5A 100%); padding: 40px 32px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                      🔔 Nouveau Rendez-vous
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 32px;">
                    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                      Un nouveau client vient de prendre rendez-vous via le site.
                    </p>
                    <div style="background-color: #f3f4f6; border-left: 4px solid #8FA382; padding: 20px; margin: 24px 0; border-radius: 4px;">
                      <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 18px; font-weight: 600;">
                        👤 Informations du client
                      </h2>
                      <p style="margin: 8px 0; color: #6b7280;"><strong>Nom :</strong> ${data.clientFirstName} ${data.clientLastName}</p>
                      <p style="margin: 8px 0; color: #6b7280;"><strong>Email :</strong> ${data.clientEmail}</p>
                      ${phoneSection}
                    </div>
                    <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 4px;">
                      <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 18px; font-weight: 600;">
                        📅 Détails du rendez-vous
                      </h2>
                      <p style="margin: 8px 0; color: #6b7280;"><strong>Date :</strong> ${data.appointmentDate}</p>
                      <p style="margin: 8px 0; color: #6b7280;"><strong>Heure :</strong> ${data.appointmentTime}</p>
                      ${typeSection}
                      ${durationSection}
                    </div>
                  </td>
                </tr>
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

  return sendEmail(
    apiKey,
    `${appName} <${fromEmail}>`,
    adminEmail,
    `🔔 Nouveau RDV - ${data.clientFirstName} ${data.clientLastName} - ${data.appointmentDate}`,
    html
  )
}

async function sendClientConfirmationEmail(
  data: NewAppointmentRequest,
  apiKey: string,
  appName: string,
  fromEmail: string,
  appUrl: string
): Promise<boolean> {
  const typeSection = data.appointmentType
    ? `<p style="margin: 8px 0; color: #6b7280;"><strong>Type :</strong> ${data.appointmentType}</p>`
    : ''

  const durationSection = data.appointmentDuration
    ? `<p style="margin: 8px 0; color: #6b7280;"><strong>Durée :</strong> ${data.appointmentDuration} minutes</p>`
    : ''

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background: linear-gradient(135deg, #8FA382 0%, #6B8E5A 100%); padding: 40px 32px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                      ✅ Rendez-vous confirmé
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 32px;">
                    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                      Bonjour <strong>${data.clientFirstName}</strong>,
                    </p>
                    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                      Votre rendez-vous a bien été enregistré. Voici les détails :
                    </p>
                    <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 4px;">
                      <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 18px; font-weight: 600;">
                        📅 Votre rendez-vous
                      </h2>
                      <p style="margin: 8px 0; color: #6b7280;"><strong>Date :</strong> ${data.appointmentDate}</p>
                      <p style="margin: 8px 0; color: #6b7280;"><strong>Heure :</strong> ${data.appointmentTime}</p>
                      ${typeSection}
                      ${durationSection}
                    </div>
                    
                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0; border-radius: 4px;">
                      <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 18px; font-weight: 600;">
                        📍 Lieu du rendez-vous
                      </h2>
                      <p style="margin: 8px 0; color: #6b7280;">
                        Pôle Val d'Amboise<br>
                        37530 Chargé
                      </p>
                    </div>

                    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
                      <p style="margin: 0 0 16px; color: #374151; font-size: 14px;">
                        Vous pouvez gérer vos rendez-vous depuis votre espace client :
                      </p>
                      <a href="${appUrl}/login" style="display: inline-block; background-color: #8FA382; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                        Accéder à mon espace
                      </a>
                    </div>

                    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 24px 0; border-radius: 4px;">
                      <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 18px; font-weight: 600;">
                        ❌ Besoin d'annuler ?
                      </h2>
                      <p style="margin: 8px 0; color: #6b7280; font-size: 14px;">
                        Si vous devez annuler ou reporter votre rendez-vous, merci de le faire au moins 24h à l'avance depuis votre espace client ou en nous contactant directement.
                      </p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f9fafb; padding: 24px 32px; border-radius: 0 0 8px 8px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                      Cet email a été envoyé automatiquement par <strong>${appName}</strong>
                    </p>
                    <p style="margin: 8px 0 0; color: #9ca3af; font-size: 12px;">
                      Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.
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

  return sendEmail(
    apiKey,
    `${appName} <${fromEmail}>`,
    data.clientEmail,
    `✅ Confirmation de votre rendez-vous - ${data.appointmentDate}`,
    html
  )
}

// ============================================================================
// EMAILS FORMULAIRE DE CONTACT
// ============================================================================

async function sendContactFormEmail(
  data: ContactFormRequest,
  apiKey: string,
  adminEmail: string,
  appName: string,
  fromEmail: string
): Promise<boolean> {
  const phoneSection = data.phone
    ? `<p style="margin: 8px 0; color: #6b7280;"><strong>Téléphone :</strong> ${data.phone}</p>`
    : ''

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background: linear-gradient(135deg, #E5B7A4 0%, #C68664 100%); padding: 40px 32px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                      ✉️ Nouveau message
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 32px;">
                    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                      Vous avez reçu un nouveau message via le formulaire de contact du site.
                    </p>
                    <div style="background-color: #f3f4f6; border-left: 4px solid #E5B7A4; padding: 20px; margin: 24px 0; border-radius: 4px;">
                      <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 18px; font-weight: 600;">
                        👤 Expéditeur
                      </h2>
                      <p style="margin: 8px 0; color: #6b7280;"><strong>Nom :</strong> ${data.name}</p>
                      <p style="margin: 8px 0; color: #6b7280;"><strong>Email :</strong> ${data.email}</p>
                      ${phoneSection}
                    </div>
                    <div style="background-color: #f9fafb; border-left: 4px solid #6b7280; padding: 20px; margin: 24px 0; border-radius: 4px;">
                      <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 18px; font-weight: 600;">
                        💬 Message
                      </h2>
                      <p style="margin: 8px 0; color: #374151; white-space: pre-wrap;">${data.message}</p>
                    </div>
                    <div style="text-align: center; margin-top: 24px;">
                      <a href="mailto:${data.email}" style="display: inline-block; background-color: #8FA382; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                        Répondre à ${data.name}
                      </a>
                    </div>
                  </td>
                </tr>
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

  return sendEmail(
    apiKey,
    `${appName} Contact <${fromEmail}>`,
    adminEmail,
    `✉️ Nouveau message de ${data.name}`,
    html
  )
}

async function sendContactFormAcknowledgement(
  data: ContactFormRequest,
  apiKey: string,
  appName: string,
  fromEmail: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background: linear-gradient(135deg, #8FA382 0%, #6B8E5A 100%); padding: 40px 32px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                      ✅ Message bien reçu
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 32px;">
                    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                      Bonjour <strong>${data.name}</strong>,
                    </p>
                    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                      Nous avons bien reçu votre message et nous vous répondrons dans les plus brefs délais.
                    </p>
                    <div style="background-color: #f3f4f6; border-left: 4px solid #8FA382; padding: 20px; margin: 24px 0; border-radius: 4px;">
                      <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 18px; font-weight: 600;">
                        📝 Récapitulatif de votre message
                      </h2>
                      <p style="margin: 8px 0; color: #374151; white-space: pre-wrap; font-style: italic;">"${data.message}"</p>
                    </div>
                    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px;">
                      Si votre demande est urgente, n'hésitez pas à nous contacter par téléphone.
                    </p>
                  </td>
                </tr>
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

  return sendEmail(
    apiKey,
    `${appName} <${fromEmail}>`,
    data.email,
    `✅ Nous avons bien reçu votre message`,
    html
  )
}

// ============================================================================
// EMAILS ANNULATION
// ============================================================================

async function sendCancellationNotificationAdmin(
  data: AppointmentCancelledRequest,
  apiKey: string,
  adminEmail: string,
  appName: string,
  fromEmail: string
): Promise<boolean> {
  const cancelledByText = data.cancelledBy === 'client' 
    ? 'Le client a annulé son rendez-vous.' 
    : 'Vous avez annulé ce rendez-vous.'

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background: linear-gradient(135deg, #C68664 0%, #a3694d 100%); padding: 40px 32px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                      ❌ Rendez-vous annulé
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 32px;">
                    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                      ${cancelledByText}
                    </p>
                    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 24px 0; border-radius: 4px;">
                      <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 18px; font-weight: 600;">
                        📅 Rendez-vous annulé
                      </h2>
                      <p style="margin: 8px 0; color: #6b7280;"><strong>Client :</strong> ${data.clientFirstName} ${data.clientLastName}</p>
                      <p style="margin: 8px 0; color: #6b7280;"><strong>Email :</strong> ${data.clientEmail}</p>
                      <p style="margin: 8px 0; color: #6b7280;"><strong>Date :</strong> ${data.appointmentDate}</p>
                      <p style="margin: 8px 0; color: #6b7280;"><strong>Heure :</strong> ${data.appointmentTime}</p>
                    </div>
                  </td>
                </tr>
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

  return sendEmail(
    apiKey,
    `${appName} <${fromEmail}>`,
    adminEmail,
    `❌ RDV annulé - ${data.clientFirstName} ${data.clientLastName} - ${data.appointmentDate}`,
    html
  )
}

async function sendCancellationConfirmationClient(
  data: AppointmentCancelledRequest,
  apiKey: string,
  appName: string,
  fromEmail: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background: linear-gradient(135deg, #C68664 0%, #a3694d 100%); padding: 40px 32px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                      ❌ Rendez-vous annulé
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 32px;">
                    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                      Bonjour <strong>${data.clientFirstName}</strong>,
                    </p>
                    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                      Votre rendez-vous a bien été annulé.
                    </p>
                    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 24px 0; border-radius: 4px;">
                      <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 18px; font-weight: 600;">
                        📅 Rendez-vous annulé
                      </h2>
                      <p style="margin: 8px 0; color: #6b7280;"><strong>Date :</strong> ${data.appointmentDate}</p>
                      <p style="margin: 8px 0; color: #6b7280;"><strong>Heure :</strong> ${data.appointmentTime}</p>
                    </div>
                    <p style="margin: 24px 0 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      Si vous souhaitez prendre un nouveau rendez-vous, vous pouvez le faire depuis votre espace client ou via notre page de contact.
                    </p>
                  </td>
                </tr>
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

  return sendEmail(
    apiKey,
    `${appName} <${fromEmail}>`,
    data.clientEmail,
    `❌ Confirmation d'annulation - ${data.appointmentDate}`,
    html
  )
}
