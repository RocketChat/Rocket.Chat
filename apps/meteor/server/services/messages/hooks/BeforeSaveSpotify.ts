import type { IMessage } from '@rocket.chat/core-typings';

// look for spotify syntax (e.g.: spotify:track:1q6IK1l4qpYykOaWaLJkWG) on the message and add them to the urls array
export class BeforeSaveSpotify {
	async convertSpotifyLinks({ message }: { message: IMessage }): Promise<IMessage> {
		if (!message.msg?.trim()) {
			return message;
		}

		const urls = Array.isArray(message.urls) ? message.urls : [];

		let changed = false;

		const msgParts = message.msg.split(/(```\w*[\n ]?[\s\S]*?```+?)|(`(?:[^`]+)`)/);
		for (let index = 0; index < msgParts.length; index++) {
			const part = msgParts[index];

			if (!/(?:```(\w*)[\n ]?([\s\S]*?)```+?)|(?:`(?:[^`]+)`)/.test(part)) {
				const re = /(?:^|\s)spotify:([^:\s]+):([^:\s]+)(?::([^:\s]+))?(?::(\S+))?(?:\s|$)/g;

				let match;
				while ((match = re.exec(part)) != null) {
					const data = match.slice(1).filter(Boolean);
					const path = data.map((value) => encodeURI(value)).join('/');
					const url = `https://open.spotify.com/${path}`;
					urls.push({ url, source: `spotify:${data.join(':')}`, meta: {} });
					changed = true;
				}
			}
		}

		if (changed) {
			message.urls = urls;
		}

		return message;
	}
}
