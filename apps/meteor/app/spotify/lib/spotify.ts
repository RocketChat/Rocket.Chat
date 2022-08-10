import type { IMessage } from '@rocket.chat/core-typings';

const process = (
	message: IMessage,
	source: string,
	callback: (msg: IMessage, msgParts: string[], index: number, part: string) => void,
): void => {
	if (!source?.trim()) {
		return;
	}

	const msgParts = source.split(/(```\w*[\n ]?[\s\S]*?```+?)|(`(?:[^`]+)`)/);
	for (let index = 0; index < msgParts.length; index++) {
		const part = msgParts[index];
		if (!/(?:```(\w*)[\n ]?([\s\S]*?)```+?)|(?:`(?:[^`]+)`)/.test(part)) {
			callback(message, msgParts, index, part);
		}
	}
};

export const createSpotifyBeforeSaveMessageHandler =
	(): ((msg: IMessage) => IMessage) =>
	(message: IMessage): IMessage => {
		const urls = Array.isArray(message.urls) ? message.urls : [];

		let changed = false;

		process(message, message.msg, (_message: IMessage, _msgParts: string[], _index: number, part: string) => {
			const re = /(?:^|\s)spotify:([^:\s]+):([^:\s]+)(?::([^:\s]+))?(?::(\S+))?(?:\s|$)/g;

			let match;
			while ((match = re.exec(part)) != null) {
				const data = match.slice(1).filter(Boolean);
				const path = data.map((value) => encodeURI(value)).join('/');
				const url = `https://open.spotify.com/${path}`;
				urls.push({ url, source: `spotify:${data.join(':')}`, meta: {} });
				changed = true;
			}
		});

		if (changed) {
			message.urls = urls;
		}

		return message;
	};
