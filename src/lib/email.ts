// src/lib/email.ts

/**
 * Service d'envoi d'emails via Supabase Edge Function + Resend
 * 
 * IMPORTANT : Cette version appelle une Supabase Edge Function qui
 * elle-même appelle l'API Resend. Cela évite les problèmes CORS.
 */

// src/lib/email.ts

export interface NewAppointmentEmailData {
  clientFirstName: string
  clientLastName: string
  clientEmail: string
  clientPhone?: string
  appointmentDate: string
  appointmentTime: string
  motif?: string
}

export async function sendNewAppointmentNotification(
  data: NewAppointmentEmailData
): Promise<boolean> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Configuration Supabase manquante')
      return false
    }

    const functionUrl = `${supabaseUrl}/functions/v1/send-email`

    console.log('📧 Envoi de l\'email via Supabase Edge Function...')

    // ✅ AJOUT : Timeout de 10 secondes
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal, // ← AJOUT
      })

      clearTimeout(timeoutId) // ← AJOUT

      // ✅ AMÉLIORATION : Vérifier le statut AVANT de parser le JSON
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
      console.log('✅ Email envoyé avec succès:', result)
      return true

    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('❌ Timeout: L\'envoi de l\'email a pris trop de temps')
        return false
      }
      
      throw fetchError // Relancer l'erreur pour le catch externe
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error)
    return false
  }
}