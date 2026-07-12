import { getGraphDefaultScope, getMicrosoftCloudEndpoints, getTenantTokenEndpoint } from './clouds';

describe('Microsoft cloud endpoints', () => {
	it.each([
		['global', 'https://login.microsoftonline.com', 'https://graph.microsoft.com'],
		['us-gov', 'https://login.microsoftonline.us', 'https://graph.microsoft.us'],
		['us-gov-dod', 'https://login.microsoftonline.us', 'https://dod-graph.microsoft.us'],
		['china', 'https://login.chinacloudapi.cn', 'https://microsoftgraph.chinacloudapi.cn'],
	] as const)('selects %s', (cloud, authority, graph) => {
		expect(getMicrosoftCloudEndpoints(cloud)).toEqual({ authority, graph });
		expect(getGraphDefaultScope(cloud)).toBe(`${graph}/.default`);
	});

	it('rejects a non-guid tenant instead of composing an authority URL', () => {
		expect(() => getTenantTokenEndpoint('global', '../common')).toThrow('invalid-tenant-id');
	});
});
