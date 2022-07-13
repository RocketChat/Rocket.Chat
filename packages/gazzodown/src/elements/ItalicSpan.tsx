import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import BoldSpan from './BoldSpan';
import LinkSpan from './LinkSpan';
import PlainSpan from './PlainSpan';
import StrikeSpan from './StrikeSpan';

type ItalicSpanProps = {
	children: (MessageParser.Link | MessageParser.MarkupExcluding<MessageParser.Italic>)[];
};

const ItalicSpan = ({ children }: ItalicSpanProps): ReactElement => (
	<em>
		{children.map((block, index) => {
			switch (block.type) {
				case 'LINK':
					return <LinkSpan key={index} href={block.value.src.value} label={block.value.label} />;

				case 'PLAIN_TEXT':
					return <PlainSpan key={index} text={block.value} />;

				case 'STRIKE':
					return <StrikeSpan key={index} children={block.value} />;

				case 'BOLD':
					return <BoldSpan key={index} children={block.value} />;

				default:
					return null;
			}
		})}
	</em>
);

export default ItalicSpan;
