import { error } from '@sveltejs/kit';
import { API_BASE, fetchTrendDetail } from '$lib/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const { data, error: apiError } = await fetchTrendDetail(params.slug);
	if (!data) {
		// Backend down (or an unexpected shape): show the reachable-state
		// page instead of a 500, so the user sees what to start.
		if (apiError?.includes('not reachable')) {
			return { detail: null, apiBase: API_BASE, error: apiError };
		}
		// Backend answered but has no such trend.
		throw error(404, `No trend found for “${params.slug}”.`);
	}
	return { detail: data, apiBase: API_BASE, error: null as string | null };
};
