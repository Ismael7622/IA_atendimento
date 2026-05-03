const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wpyavpnyhebqivfphrbt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndweWF2cG55aGVicWl2ZnBocmJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTc1Mzc0MCwiZXhwIjoyMDYxMzI5NzQwfQ.QDxe_BSGqHYmqNL6xul2kLvHMk6AYRgdX3ypeYyjdt4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Testing inserting into z_bd_produtos to see the exact error...");
  const { data, error } = await supabase.from('z_bd_produtos').insert([{
    tenant_id: 'test',
    nome: 'Test Script Product',
    preco: 100
  }]);

  if (error) {
    console.error("Insert Error:", error);
  } else {
    console.log("Insert Success:", data);
  }
}

run();
