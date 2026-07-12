import type { MicrosoftCloud } from './types';

export type MicrosoftCloudEndpoints = {
	authority: string;
	graph: string;
};

const CLOUDS: Record<MicrosoftCloud, MicrosoftCloudEndpoints> = {
	'global': { authority: 'https://login.microsoftonline.com', graph: 'https://graph.microsoft.com' },
	'us-gov': { authority: 'https://login.microsoftonline.us', graph: 'https://graph.microsoft.us' },
	'us-gov-dod': { authority: 'https://login.microsoftonline.us', graph: 'https://dod-graph.microsoft.us' },
	'china': { authority: 'https://login.chinacloudapi.cn', graph: 'https://microsoftgraph.chinacloudapi.cn' },
};

export const getMicrosoftCloudEndpoints = (cloud: MicrosoftCloud): MicrosoftCloudEndpoints => CLOUDS[cloud];

export const getGraphDefaultScope = (cloud: MicrosoftCloud): string => `${getMicrosoftCloudEndpoints(cloud).graph}/.default`;

export const getTenantTokenEndpoint = (cloud: MicrosoftCloud, tenantId: string): string => {
	if (!/^[0-9a-f-]{36}$/i.test(tenantId)) {
		throw new Error('invalid-tenant-id');
	}

	return `${getMicrosoftCloudEndpoints(cloud).authority}/${tenantId}/oauth2/v2.0/token`;
};
