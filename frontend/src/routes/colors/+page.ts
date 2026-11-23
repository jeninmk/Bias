import { API_BASE, fetchColors } from '$lib/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const { data, error } = await fetchColors();
	return { colors: data ?? [], apiBase: API_BASE, error };
};
