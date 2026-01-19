// src/lib/email.ts

/**
 * Service d'envoi d'emails via Supabase Edge Function + Resend
 * 
 * IMPORTANT : Cette version appelle une Supabase Edge Function qui
 * elle-même appelle l'API Resend. Cela évite les problèmes CORS.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface NewAppointmentEmailData {
  clientFirstName: string
  clientLastName: string
  clientEmail: string
  clientPhone?: string
  appointmentDate: string
  appointmentTime: string
  appointmentType?: string
  appointmentDuration?: number
}

export interface ContactFormEmailData {
  name: string
  email: string
  phone?: string
  message: string
}

export interface AppointmentCancelledEmailData {
  clientFirstName: string
  clientLastName: string
  clientEmail: string
  appointmentDate: string
  appointmentTime: string
  cancelledBy: 'client' | 'admin'
}

// ============================================================================
// FONCTION UTILITAIRE
// ============================================================================

async function callEmailFunction(data: Record<string, unknown>): Promise<boolean> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Configuration Supabase manquante')
      return false
    }

    const functionUrl = `${supabaseUrl}/functions/v1/send-email`

    console.log('📧 Envoi de l\'email via Supabase Edge Function...')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout

    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // Si le parsing JSON échoue, on garde le message par défaut
        }
        console.error('❌ Erreur lors de l\'envoi de l\'email:', errorMessage)
        return false
      }

      const result = await response.json()
      console.log('✅ Email(s) envoyé(s) avec succès:', result)
      return true

    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('❌ Timeout: L\'envoi de l\'email a pris trop de temps')
        return false
      }
      
      throw fetchError
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error)
    return false
  }
}

// ============================================================================
// FONCTIONS PUBLIQUES
// ============================================================================

/**
 * Envoie les notifications de nouveau rendez-vous
 * - Email à l'admin pour l'informer du nouveau RDV
 * - Email au client pour confirmer son RDV
 */
export async function sendNewAppointmentNotification(
  data: NewAppointmentEmailData
): Promise<boolean> {
  return callEmailFunction({
    type: 'new_appointment',
    ...data,
  })
}

/**
 * Envoie le message du formulaire de contact
 * - Email à l'admin avec le message
 * - Email au visiteur pour confirmer la réception
 */
export async function sendContactFormMessage(
  data: ContactFormEmailData
): Promise<boolean> {
  return callEmailFunction({
    type: 'contact_form',
    ...data,
  })
}

/**
 * Envoie les notifications d'annulation de rendez-vous
 * - Email à l'admin pour l'informer de l'annulation
 * - Email au client pour confirmer l'annulation
 */
export async function sendAppointmentCancelledNotification(
  data: AppointmentCancelledEmailData
): Promise<boolean> {
  return callEmailFunction({
    type: 'appointment_cancelled',
    ...data,
  })
}
