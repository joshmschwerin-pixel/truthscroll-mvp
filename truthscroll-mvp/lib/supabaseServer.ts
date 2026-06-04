import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
	const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
	const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
	if (!url || !serviceKey) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
	return createClient(url, serviceKey);
}

export default getSupabaseAdmin;
