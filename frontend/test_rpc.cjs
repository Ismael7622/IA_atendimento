const supabaseUrl = 'https://wpyavpnyhebqivfphrbt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndweWF2cG55aGVicWl2ZnBocmJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTc1Mzc0MCwiZXhwIjoyMDYxMzI5NzQwfQ.QDxe_BSGqHYmqNL6xul2kLvHMk6AYRgdX3ypeYyjdt4';

async function run() {
  const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`, {
    headers: { 'Authorization': `Bearer ${supabaseKey}` }
  });
  const openapi = await res.json();
  const paths = Object.keys(openapi.paths).filter(p => p.startsWith('/rpc/'));
  console.log("RPC Functions found:", paths);
}

run();
