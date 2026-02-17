import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://kcrhhxpfxxcrtnkawpbo.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjcmhoeHBmeHhjcnRua2F3cGJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMTA1MjMsImV4cCI6MjA4Njg4NjUyM30.-tu66lc2QPFRl25vDFBiIv0HQBQQPn8NatWxKgLInXk";

export const supabase = createClient(supabaseUrl, supabaseKey);