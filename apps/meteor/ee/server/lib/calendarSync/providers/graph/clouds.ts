export type GraphCloud = 'commercial' | 'gcc-high' | 'dod';

/**
 * Microsoft national-cloud endpoints. GCC High and DoD (Azure Government) matter
 * for Rocket.Chat's federal customers; both authenticate against the .us login host.
 */
export const GRAPH_CLOUDS: Record<GraphCloud, { loginHost: string; graphHost: string }> = {
	'commercial': {
		loginHost: 'https://login.microsoftonline.com',
		graphHost: 'https://graph.microsoft.com',
	},
	'gcc-high': {
		loginHost: 'https://login.microsoftonline.us',
		graphHost: 'https://graph.microsoft.us',
	},
	'dod': {
		loginHost: 'https://login.microsoftonline.us',
		graphHost: 'https://dod-graph.microsoft.us',
	},
};

export function resolveGraphCloud(value: string | undefined): GraphCloud {
	return value === 'gcc-high' || value === 'dod' ? value : 'commercial';
}
