import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// これでおにいのアプリ専用の「Supabaseと喋るための窓口」が完成！
export const supabase = createClient(supabaseUrl, supabaseAnonKey);