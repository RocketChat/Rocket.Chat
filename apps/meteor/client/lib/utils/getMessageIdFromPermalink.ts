/**
 * Extracts the message id from a message permalink such as
 * `https://open.rocket.chat/channel/general?msg=abc123`.
 * Returns `undefined` when the link has no `msg` query parameter or cannot be parsed.
 */
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
