import { isE2EEMessage } from '@rocket.chat/core-typings';
import type { IMessage } from '@rocket.chat/core-typings';
import type { Root } from '@rocket.chat/message-parser';
import { parse as peggyParse } from '@rocket.chat/message-parser';

import { getMessageMaxParseLength } from '../../../../lib/getMessageMaxParseLength';

let napiParse: ((input: string) => Root) | undefined;

if (process.env.EXPERIMENTAL_NAPI_PARSER === 'true') {
	try {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const napi = require('@rocket.chat/message-parser-napi');
		napiParse = (input: string) => napi.parse(input) as Root;
		console.info('Using experimental N-API message parser (logos DFA + recursive descent)');
	} catch (e) {
		console.warn('EXPERIMENTAL_NAPI_PARSER enabled but native addon failed to load, falling back to Peggy', e);
	}
}

const parse = napiParse ?? peggyParse;

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

			if (message.attachments?.[0]?.description) {
				message.attachments[0].descriptionMd = parse(message.attachments[0].description, config);
			}
		} catch (e) {
			console.error(e); // errors logged while the parser is at experimental stage
		}

		return message;
	}
}
