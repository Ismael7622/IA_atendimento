const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wpyavpnyhebqivfphrbt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndweWF2cG55aGVicWl2ZnBocmJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTc1Mzc0MCwiZXhwIjoyMDYxMzI5NzQwfQ.QDxe_BSGqHYmqNL6xul2kLvHMk6AYRgdX3ypeYyjdt4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
  console.log("Checking RLS policies for z_bd_atendimento_clientes...");
  const { data, error } = await supabase.rpc('get_policies', { table_name: 'z_bd_atendimento_clientes' });
  
  if (error) {
    // If RPC doesn't exist, try querying pg_policies directly via SQL
    console.log("RPC failed, trying raw query...");
    const { data: policies, error: sqlError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'z_bd_atendimento_clientes');
      
    if (sqlError) {
      console.error("SQL Error:", sqlError);
      // Let's try to just query the table and see what we get
      const { data: countData, error: countError } = await supabase
        .from('z_bd_atendimento_clientes')
        .select('*', { count: 'exact', head: true });
      console.log("Total rows in z_bd_atendimento_clientes (bypass RLS):", countData);
      
      const { data: distinctUsers, error: distinctError } = await supabase
        .from('z_bd_atendimento_clientes')
        .select('user_id');
      console.log("Distinct user_ids:", [...new Set(distinctUsers?.map(u => u.user_id))]);
    } else {
      console.log("Policies:", policies);
    }
  } else {
    console.log("Policies:", data);
  }
}

checkRLS();
