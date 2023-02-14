import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import ItalicSpan from './ItalicSpan';
import LinkSpan from './LinkSpan';
import PlainSpan from './PlainSpan';
import StrikeSpan from './StrikeSpan';

type BoldSpanProps = {
	children: (MessageParser.Link | MessageParser.MarkupExcluding<MessageParser.Bold>)[];
};

const BoldSpan = ({ children }: BoldSpanProps): ReactElement => (
	<strong>
		{children.map((block, index) => {
			switch (block.type) {
				case 'LINK':
					return <LinkSpan key={index} href={block.value.src.value} label={block.value.label} />;

				case 'PLAIN_TEXT':
					return <PlainSpan key={index} text={block.value} />;

				case 'STRIKE':
					return <StrikeSpan key={index} children={block.value} />;

				case 'ITALIC':
					return <ItalicSpan key={index} children={block.value} />;

				default:
					return null;
			}
		})}
	</strong>
);

export default BoldSpan;
