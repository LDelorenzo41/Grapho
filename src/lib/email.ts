// src/lib/email.ts

/**
 * Service d'envoi d'emails via Supabase Edge Function + Resend
 * 
 * IMPORTANT : Cette version appelle une Supabase Edge Function qui
 * elle-même appelle l'API Resend. Cela évite les problèmes CORS.
 */

export interface NewAppointmentEmailData {
  clientFirstName: string
  clientLastName: string
  clientEmail: string
  clientPhone?: string
  appointmentDate: string  // Format: "Mercredi 12 novembre 2025"
  appointmentTime: string  // Format: "14:00"
  motif?: string
}

/**
 * Envoie une notification email à l'admin quand un client prend un premier RDV
 */
export async function sendNewAppointmentNotification(
  data: NewAppointmentEmailData
): Promise<boolean> {
  try {
    // URL de la Supabase Edge Function
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Configuration Supabase manquante')
      return false
    }

    const functionUrl = `${supabaseUrl}/functions/v1/send-email`

    console.log('📧 Envoi de l\'email via Supabase Edge Function...')

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ Erreur lors de l\'envoi de l\'email:', result)
      return false
    }

    console.log('✅ Email envoyé avec succès:', result)
    return true

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error)
    return false
  }
}