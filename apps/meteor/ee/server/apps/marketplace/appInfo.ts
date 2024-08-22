import type { IMarketplaceInfo } from '@rocket.chat/apps-engine/server/marketplace';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

export const getMarketplaceAppInfo = async ({
	baseUrl,
	headers,
	appId,
	version,
}: {
	baseUrl: string;
	headers: Record<string, any>;
	appId: string;
	version: string;
}): Promise<IMarketplaceInfo> => {
	const appInfosURL = new URL(`${baseUrl}/v1/apps/${appId}`);
	appInfosURL.searchParams.set('appVersion', String(version));
	const appInfoResponse = await fetch(appInfosURL.toString(), {
		headers,
	});

	if (!appInfoResponse.ok) {
		const result = await appInfoResponse.json();
		throw new Error(result?.error || 'Error fetching app information from the Marketplace.');
	}

	const [data] = await appInfoResponse.json();
	return data;
};
