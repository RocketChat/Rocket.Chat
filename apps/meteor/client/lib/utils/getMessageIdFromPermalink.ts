export const getMessageIdFromPermalink = (permalink: string | undefined): string | undefined => {
	if (!permalink) {
		return undefined;
	}

	try {
		const msgId = new URL(permalink, 'http://localhost').searchParams.get('msg');
		return msgId || undefined;
	} catch {
		return undefined;
	}
};
