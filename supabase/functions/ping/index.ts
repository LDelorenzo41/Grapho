import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Gérer les requêtes OPTIONS (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Créer un client Supabase pour faire une vraie requête à la DB
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Faire une requête simple pour garder la DB active
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('Ping DB error:', error.message)
    }

    return new Response(
      JSON.stringify({ 
        ok: true, 
        ts: Date.now(),
        db_users_count: count ?? 0,
        message: 'Pong! Database is awake.'
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ 
        ok: false, 
        ts: Date.now(),
        error: (err as Error).message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
