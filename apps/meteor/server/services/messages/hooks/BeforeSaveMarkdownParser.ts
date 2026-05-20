import { isE2EEMessage } from '@rocket.chat/core-typings';
import type { IMessage } from '@rocket.chat/core-typings';
import { parse } from '@rocket.chat/message-parser';

import { getMessageMaxParseLength } from '../../../../lib/getMessageMaxParseLength';

type ParserConfig = {
	colors?: boolean;
	emoticons?: boolean;
	customDomains?: string[];
	katex?: {
		dollarSyntax: boolean;
		parenthesisSyntax: boolean;
	};
};

export class BeforeSaveMarkdownParser {
	constructor(private enabled: boolean = true) {
		// no op
	}

	async parseMarkdown({ message, config }: { message: IMessage; config: ParserConfig }): Promise<IMessage> {
		if (!this.enabled) {
			return message;
		}

		if (isE2EEMessage(message)) {
			return message;
		}

		const messageMaxParseLength = getMessageMaxParseLength();
		if (messageMaxParseLength > 0 && message.msg && message.msg.length > messageMaxParseLength) {
			delete message.md;
			return message;
		}

		try {
			if (message.msg) {
				message.md = parse(message.msg, config);
			}
		} catch (e) {
			console.error(e); // errors logged while the parser is at experimental stage
		}

		return message;
	}
}
