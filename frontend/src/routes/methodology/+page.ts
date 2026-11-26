import { fetchMethodology } from '$lib/api';
import type { PageLoad } from './$types';

// The methodology content is static (ported verbatim from v1). The load
// still pings GET /api/methodology so the page reflects the backend when
// it is up, but a failure is non-fatal. The built-in copy renders anyway.
export const load: PageLoad = async () => {
	const { error } = await fetchMethodology();
	return { backendError: error };
};
