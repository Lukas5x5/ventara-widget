import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ttfmksjpmooojqwfatvb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0Zm1rc2pwbW9vb2pxd2ZhdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NDc0NTMsImV4cCI6MjA3NDIyMzQ1M30.ajr3XdZtMsWmcqBz_8b20bmMw0XkP1I_zytOs1HdPsE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
