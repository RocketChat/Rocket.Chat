export const buildDeepLinkURL = (resumeToken: string, userId: string) => {
	const url = new URL(window.location.href);
	const { origin } = url;
	return `rocketchat://auth?host=${origin}&token=${resumeToken}&userId=${userId}`;
};
