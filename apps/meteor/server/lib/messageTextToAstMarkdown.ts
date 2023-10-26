import type { Options, Root } from '@rocket.chat/message-parser';
import { parse } from '@rocket.chat/message-parser';

import { settings } from '../../app/settings/server';

export const messageTextToAstMarkdown = (messageText: string): Root => {
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
