import type { SignedSupportedVersions } from '@rocket.chat/server-cloud-communication';

export const supportedVersionsChooseLatest = async (...tokens: (SignedSupportedVersions | undefined)[]) => {
	const [token] = (tokens.filter(Boolean) as SignedSupportedVersions[]).sort((a, b) => {
		return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
	});

	return token;
};
