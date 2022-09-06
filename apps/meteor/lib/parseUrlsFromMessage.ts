import { IMessage } from "@rocket.chat/core-typings";
import { parse } from "@rocket.chat/message-parser";

export function parseUrlsFromMessage(message: IMessage): string[] {
	const urls: string[] = [];

	if(!message.msg) {
		return urls;
	}

	const parsedMessage = message?.md ?? parse(message.msg);

	parsedMessage.map((block) => {
		if(block.type !== 'PARAGRAPH') {
			return;
		}

		block.value.map(inline => {
			if (inline.type === 'LINK') {
				urls.push(inline.value.src.value);
			}
		});
	});

	return urls;
};
