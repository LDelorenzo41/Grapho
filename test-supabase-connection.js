import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://enrcpdtlcwpjeeflkszv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVucmNwZHRsY3dwamVlZmxrc3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMTE4ODIsImV4cCI6MjA3Njc4Nzg4Mn0.ltf44_TC17fXzVQ2h1db-BZsqgIQo-lFW3b7gtRaXy8';

async function testConnection() {
  console.log('🔍 Test de connexion à Supabase...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const tables = [
    'users',
    'appointments',
    'documents',
    'messages',
    'settings',
    'consents',
    'sessions',
    'prescriptions'
  ];

  console.log('📋 Vérification des tables:\n');

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ Table "${table}": ERREUR`);
        console.log(`   Code: ${error.code}`);
        console.log(`   Message: ${error.message}`);
        console.log(`   Détails: ${error.details}\n`);
      } else {
        console.log(`✅ Table "${table}": OK (${data ? data.length : 0} enregistrement(s) trouvé(s))`);
      }
    } catch (err) {
      console.log(`❌ Table "${table}": EXCEPTION`);
      console.log(`   ${err.message}\n`);
    }
  }

  console.log('\n📊 Résumé:');
  console.log('Si vous voyez des erreurs "relation does not exist", cela signifie que');
  console.log('les tables n\'ont pas été créées dans Supabase.');
  console.log('\nVous devez exécuter le script SQL dans l\'éditeur SQL de Supabase:');
  console.log('1. Allez sur https://enrcpdtlcwpjeeflkszv.supabase.co');
  console.log('2. Cliquez sur "SQL Editor" dans le menu de gauche');
  console.log('3. Copiez le contenu de setup-database.sql');
  console.log('4. Collez-le dans l\'éditeur SQL et exécutez-le');
}

testConnection().catch(console.error);
