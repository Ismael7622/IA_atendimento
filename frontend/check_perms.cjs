const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wpyavpnyhebqivfphrbt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndweWF2cG55aGVicWl2ZnBocmJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTc1Mzc0MCwiZXhwIjoyMDYxMzI5NzQwfQ.QDxe_BSGqHYmqNL6xul2kLvHMk6AYRgdX3ypeYyjdt4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPermissions() {
  console.log("Checking permissions table...");
  const { data, error } = await supabase.from('z_bd_usuarios_permissoes').select('*');
  if (error) console.error(error);
  else console.log(data);
}

checkPermissions();
