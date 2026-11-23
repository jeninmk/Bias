import { API_BASE, fetchTrends } from '$lib/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const { data, error } = await fetchTrends();
	return {
		trends: data ?? [],
		// v1 seed stats; the backend may later supply these from /api/trends.
		observationCount: 433,
		weeksOfData: 8,
		apiBase: API_BASE,
		error
	};
};
