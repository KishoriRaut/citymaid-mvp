const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fdgqqxyyofjnkhswkwcq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkZ3FxeHl5b2Zqbmtoc3drd2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMjQyMTMsImV4cCI6MjA1OTYwMDIxM30.YyJLLu3r2a7Mh7ny0ie-YzzLfPh5PdrJJHnBFBxWqVE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorage() {
  try {
    // List all files in the maid-photos bucket
    const { data, error } = await supabase.storage
      .from('maid-photos')
      .list();

    if (error) {
      console.error('Error accessing storage:', error);
      return;
    }

    console.log('Files in maid-photos bucket:');
    console.log(data);
  } catch (err) {
    console.error('Error:', err);
  }
}

checkStorage(); 