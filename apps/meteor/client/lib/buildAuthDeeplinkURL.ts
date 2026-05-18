export const buildDeepLinkURL = (resumeToken: string, userId: string) => {
	const url = new URL(window.location.href);
	const { host } = url;
	return `rocketchat://auth?host=http://${host}&token=${resumeToken}&userId=${userId}`;
};
