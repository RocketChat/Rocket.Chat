import * as MessageParser from '@rocket.chat/message-parser';
import React, { ReactElement } from 'react';

import { baseURI } from '../../../lib/baseURI';
import BoldSpan from './BoldSpan';
import ItalicSpan from './ItalicSpan';
import PlainSpan from './PlainSpan';
import StrikeSpan from './StrikeSpan';

type LinkSpanProps = {
	href: string;
	label: MessageParser.Markup;
};

const LinkSpan = ({ href, label }: LinkSpanProps): ReactElement => {
	const attrs = href.indexOf(baseURI) !== 0 ? { rel: 'noopener noreferrer', target: '_blank' } : {};

	return (
		<a href={href} data-title={href} {...attrs}>
			{((block: MessageParser.Markup): JSX.Element | string | null => {
				switch (block.type) {
					case 'PLAIN_TEXT':
						return <PlainSpan text={block.value} />;

					case 'STRIKE':
						return <StrikeSpan children={block.value} />;

					case 'ITALIC':
						return <ItalicSpan children={block.value} />;

					case 'BOLD':
						return <BoldSpan children={block.value} />;

					default:
						return null;
				}
			})(label)}
		</a>
	);
};

export default LinkSpan;
