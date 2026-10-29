import type { IMessage } from '@rocket.chat/core-typings';

/**
 * Whether a message holds an embed that reloads when it is mounted again: a file player or a URL preview such as an
 * iframe. Only those stay mounted outside the viewport, since every one of them defeats virtualization a little.
 */
export const hasLiveEmbed = (message: IMessage) =>
	(message.files?.length ?? 0) > 0 || (message.urls?.some((url) => Object.keys(url.meta ?? {}).length > 0 || !!url.headers) ?? false);
