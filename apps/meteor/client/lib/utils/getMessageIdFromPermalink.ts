export const getMessageIdFromPermalink = (permalink?: string): string | undefined => {
	try {
		return new URL(permalink ?? '', 'http://localhost').searchParams.get('msg') || undefined;
	} catch {
		return undefined;
	}
};
