import { isE2EEMessage, isOTRMessage, isOTRAckMessage } from '@rocket.chat/core-typings';
import type { IMessage } from '@rocket.chat/core-typings';
import { parse } from '@rocket.chat/message-parser';

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

		if (isE2EEMessage(message) || isOTRMessage(message) || isOTRAckMessage(message)) {
			return message;
		}

		try {
			if (message.msg) {
				message.md = parse(message.msg, config);
			}

			if (message.attachments?.[0]?.description !== undefined) {
				message.attachments[0].descriptionMd = parse(message.attachments[0].description, config);
			}
		} catch (e) {
			console.error(e); // errors logged while the parser is at experimental stage
		}

		return message;
	}
}
