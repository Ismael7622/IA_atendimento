const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wpyavpnyhebqivfphrbt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndweWF2cG55aGVicWl2ZnBocmJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTc1Mzc0MCwiZXhwIjoyMDYxMzI5NzQwfQ.QDxe_BSGqHYmqNL6xul2kLvHMk6AYRgdX3ypeYyjdt4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProducts() {
  console.log("Checking products table distribution...");
  const { data, error } = await supabase.from('z_bd_produtos').select('tenant_id');
  if (error) console.error(error);
  else console.log("Distinct tenant_ids in products:", [...new Set(data?.map(u => u.tenant_id))]);
}

checkProducts();
