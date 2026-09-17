import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ahudntitzvawaelgnici.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFodWRudGl0enZhd2FlbGduaWNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyNTMxNzUsImV4cCI6MjEwNDgyOTE3NX0.tnm1HKNtAEWK3LFSvMqkfS2wLsCk-XQpTG1jE4jHvYo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data: salons } = await supabase.from('salons').select('id, name, slug, owner_id, owner_email, owner_name, subscription_status');
  console.log('ALL SALONS:');
  salons.forEach((s, idx) => {
    console.log(`${idx + 1}. [${s.id}] name: "${s.name}", slug: "${s.slug}", owner_id: "${s.owner_id}", owner_email: "${s.owner_email}", owner_name: "${s.owner_name}"`);
  });
}

check();
