import type * as MessageParser from '@rocket.chat/message-parser';
import { useMemo } from 'react';

import { sanitizeUrl } from './sanitizeUrl';

const flattenMarkup = (
	markup:
		| MessageParser.Timestamp
		| MessageParser.Markup
		| MessageParser.InlineCode
		| MessageParser.Link
		| MessageParser.Emoji
		| MessageParser.ChannelMention
		| MessageParser.UserMention,
): string => {
	switch (markup.type) {
		case 'PLAIN_TEXT':
			return markup.value;

		case 'ITALIC':
		case 'BOLD':
		case 'STRIKE':
			return markup.value.map(flattenMarkup).join('');

		case 'INLINE_CODE':
			return flattenMarkup(markup.value);

		case 'LINK': {
			const label = flattenMarkup(markup.value.label as MessageParser.Markup);
			const href = markup.value.src.value;

			return label ? `${label} (${href})` : href;
		}

		default:
			return '';
	}
};

const style = {
	maxWidth: '100%',
};

type ImageElementProps = {
	src: string;
	alt: MessageParser.Markup;
};

const ImageElement = ({ src, alt }: ImageElementProps) => {
	const plainAlt = useMemo(() => flattenMarkup(alt), [alt]);
	const safeSrc = sanitizeUrl(src);

	return (
		<a href={safeSrc} target='_blank' rel='noopener noreferrer' title={plainAlt}>
			<img src={safeSrc} data-title={safeSrc} alt={plainAlt} style={style} />
		</a>
	);
};

export default ImageElement;
