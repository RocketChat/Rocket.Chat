export const buildDeepLinkURL = (resumeToken: string, userId: string) => {
	const url = new URL(window.location.href);
	const { origin } = url;
	return `rocketchat://auth?host=${origin}&token=${resumeToken}&userId=${userId}`;
};

export const buildSamlDeepLinkURL = (credentialToken: string) => {
	const { origin } = new URL(window.location.href);
	const params = new URLSearchParams({ type: 'saml', host: origin, credentialToken });

	return `rocketchat://auth?${params.toString()}`;
};
