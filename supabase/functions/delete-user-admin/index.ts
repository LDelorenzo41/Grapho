import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  // Gérer les requêtes CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }

  // Headers CORS pour toutes les réponses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
  };

  // 1. Vérifier le header d'autorisation
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    console.error('❌ Pas de header Authorization');
    return new Response(
      JSON.stringify({ error: 'Unauthorized: Missing authorization header' }),
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    // 2. Créer un client Supabase pour vérifier l'utilisateur authentifié
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { 
          headers: { Authorization: authHeader } 
        } 
      }
    );
    
    // 3. Récupérer l'utilisateur authentifié
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Erreur getUser:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: corsHeaders }
      );
    }

    console.log('✅ Utilisateur authentifié:', user.email);

    // 4. Vérifier que l'utilisateur est admin
    const { data: userData, error: roleError } = await supabaseClient
      .from('users')
      .select('role, email')
      .eq('id', user.id)
      .single();
    
    if (roleError) {
      console.error('❌ Erreur récupération rôle:', roleError);
      return new Response(
        JSON.stringify({ error: 'Error checking user role' }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (userData?.role !== 'admin') {
      console.error('❌ Utilisateur non-admin tente de supprimer:', userData?.email);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: corsHeaders }
      );
    }

    console.log('✅ Utilisateur est admin:', userData.email);

    // 5. Récupérer l'ID de l'utilisateur à supprimer
    const { userId } = await req.json();
    
    if (!userId) {
      console.error('❌ userId manquant dans le body');
      return new Response(
        JSON.stringify({ error: 'Missing userId parameter' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 6. Empêcher l'admin de se supprimer lui-même
    if (userId === user.id) {
      console.error('❌ Admin tente de se supprimer lui-même');
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own account' }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`🗑️ Admin ${userData.email} supprime l'utilisateur ${userId}`);

    // 7. Créer un client admin avec la Service Role Key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // 8. Récupérer les infos de l'utilisateur à supprimer (pour les logs)
    const { data: targetUser } = await supabaseAdmin
      .from('users')
      .select('email, first_name, last_name')
      .eq('id', userId)
      .single();

    console.log('🎯 Utilisateur cible:', targetUser?.email);

    // 9. Supprimer de la table users (cascade automatique pour toutes les données liées)
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (dbError) {
      console.error('❌ Erreur suppression table users:', dbError);
      throw new Error(`Database deletion failed: ${dbError.message}`);
    }
    
    console.log('✅ Utilisateur supprimé de la table users (+ cascade)');
    
    // 10. Supprimer de auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.error('⚠️ Erreur suppression auth.users:', authError);
      // Ne pas throw car la suppression DB a réussi
      // L'utilisateur ne pourra de toute façon plus se connecter
      console.warn('⚠️ Données supprimées mais compte auth reste');
    } else {
      console.log('✅ Utilisateur supprimé de auth.users');
    }
    
    // 11. Retourner le succès
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `User ${targetUser?.email || userId} deleted successfully`,
        deletedFrom: {
          database: true,
          authentication: !authError
        }
      }),
      { 
        status: 200,
        headers: corsHeaders
      }
    );
    
  } catch (error) {
    console.error('❌ Erreur globale:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
});