import type { CloudVersionsResponse } from '@rocket.chat/server-cloud-communication';

export const supportedVersionsChooseLatest = async (...tokens: (CloudVersionsResponse | undefined)[]) => {
	const [token] = (tokens.filter(Boolean) as CloudVersionsResponse[]).sort((a, b) => {
		return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
	});

	return token?.signed ?? '';
};
