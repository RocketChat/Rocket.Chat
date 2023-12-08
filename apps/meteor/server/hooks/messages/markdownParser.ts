import { isE2EEMessage, isOTRMessage, isOTRAckMessage } from '@rocket.chat/core-typings';
import type { Options, Root } from '@rocket.chat/message-parser';
import { parse } from '@rocket.chat/message-parser';

import { settings } from '../../../app/settings/server';
import { callbacks } from '../../../lib/callbacks';
import { SystemLogger } from '../../lib/logger/system';

if (process.env.DISABLE_MESSAGE_PARSER !== 'true') {
	callbacks.add(
		'beforeSaveMessage',
		(message) => {
			if (isE2EEMessage(message) || isOTRMessage(message) || isOTRAckMessage(message)) {
				return message;
			}
			try {
				if (message.msg) {
					message.md = messageTextToAstMarkdown(message.msg);
				}

				if (message.attachments?.[0]?.description !== undefined) {
					message.attachments[0].descriptionMd = messageTextToAstMarkdown(message.attachments[0].description);
				}
			} catch (e) {
				SystemLogger.error(e); // errors logged while the parser is at experimental stage
			}

			return message;
		},
		callbacks.priority.MEDIUM,
		'markdownParser',
	);
}

const messageTextToAstMarkdown = (messageText: string): Root => {
	const customDomains = settings.get<string>('Message_CustomDomain_AutoLink')
		? settings
				.get<string>('Message_CustomDomain_AutoLink')
				.split(',')
				.map((domain) => domain.trim())
		: [];

	const parseOptions: Options = {
		colors: settings.get('HexColorPreview_Enabled'),
		emoticons: true,
		customDomains,
		...(settings.get('Katex_Enabled') && {
			katex: {
				dollarSyntax: settings.get('Katex_Dollar_Syntax'),
				parenthesisSyntax: settings.get('Katex_Parenthesis_Syntax'),
			},
		}),
	};

	return parse(messageText, parseOptions);
};
