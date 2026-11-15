import type { IMessage } from '@rocket.chat/core-typings';

export const useKeepMountedMessages = (messages: IMessage[], canPreview: boolean = false): number[] => {
	const offset = canPreview ? 1 : 0;
	return messages.reduce<number[]>((acc, message, index) => {
		// Keep mounted anything with an embed that reloads when re-mounted: file
		// attachments (audio/video players) and URL previews (e.g. YouTube iframes).
		// Otherwise virtua recycles them on scroll-to-bottom (new message / reaction
		// growing a message) and the iframe flickers.
		//
		// Don't extend this to other message/attachment types just to preserve some local
		// UI state. Every match here stays mounted for the life of the list regardless of
		// scroll position, so it only scales for the "needs a live browser resource" case
		// above and adding more to it defeats virtualization in media-heavy channels.
		const hasUrlPreview = message.urls?.some((url) => Object.keys(url.meta ?? {}).length > 0 || !!url.headers) ?? false;
		if ((message.files?.length ?? 0) > 0 || hasUrlPreview) {
			acc.push(index + offset);
		}
		return acc;
	}, []);
};
