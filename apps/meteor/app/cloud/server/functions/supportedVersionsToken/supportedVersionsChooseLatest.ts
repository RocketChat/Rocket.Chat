import type { SignedSupportedVersions } from '@rocket.chat/server-cloud-communication';

export const supportedVersionsChooseLatest = async (...tokens: (SignedSupportedVersions | undefined)[]) => {
	const [token] = (tokens.filter((r) => r?.timestamp != null) as SignedSupportedVersions[]).sort((a, b) => {
		return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
	});

	return token;
};
