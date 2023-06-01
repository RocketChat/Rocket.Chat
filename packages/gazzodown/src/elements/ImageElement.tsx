import type * as MessageParser from '@rocket.chat/message-parser';
import { ReactElement, useMemo } from 'react';

const flattenMarkup = (
	markup: MessageParser.Markup | MessageParser.Link | MessageParser.Emoji | MessageParser.ChannelMention | MessageParser.UserMention,
): string => {
	switch (markup.type) {
		case 'PLAIN_TEXT':
			return markup.value;

		case 'ITALIC':
		case 'BOLD':
		case 'STRIKE':
			return markup.value.map(flattenMarkup).join('');

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

const ImageElement = ({ src, alt }: ImageElementProps): ReactElement => {
	const plainAlt = useMemo(() => flattenMarkup(alt), [alt]);

	return (
		<a href={src} target='_blank' rel='noopener noreferrer' title={plainAlt}>
			<img src={src} data-title={src} alt={plainAlt} style={style} />
		</a>
	);
};

export default ImageElement;
