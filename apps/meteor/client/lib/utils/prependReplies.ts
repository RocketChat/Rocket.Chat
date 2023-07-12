import type { IMessage } from '@rocket.chat/core-typings';

import { ui } from '../ui';

export const prependReplies = async (msg: string, replies: IMessage[] = []): Promise<string> => {
	const chunks = await Promise.all(
		replies.map(async ({ _id }) => {
			const permalink = await ui.getMessageLinkById(_id);

			return `[ ](${permalink})`;
		}),
	);

	chunks.push(msg);
	return chunks.join('\n');
};
