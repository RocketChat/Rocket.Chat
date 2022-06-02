import * as MessageParser from '@rocket.chat/message-parser';

export const flattenMarkup = (markup: MessageParser.Markup | MessageParser.Link): string => {
	switch (markup.type) {
		case 'PLAIN_TEXT':
			return markup.value;

		case 'ITALIC':
		case 'BOLD':
		case 'STRIKE':
			return markup.value.map(flattenMarkup).join('');

		case 'LINK': {
			const label = flattenMarkup(markup.value.label);
			const href = markup.value.src.value;

			return label ? `${label} (${href})` : href;
		}

		default:
			return '';
	}
};
