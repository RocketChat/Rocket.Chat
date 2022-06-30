import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import BoldSpan from './BoldSpan';
import ItalicSpan from './ItalicSpan';
import LinkSpan from './LinkSpan';
import PlainSpan from './PlainSpan';

type StrikeSpanProps = {
	children: (MessageParser.Link | MessageParser.MarkupExcluding<MessageParser.Strike>)[];
};

const StrikeSpan = ({ children }: StrikeSpanProps): ReactElement => (
	<del>
		{children.map((block, index) => {
			switch (block.type) {
				case 'LINK':
					return <LinkSpan key={index} href={block.value.src.value} label={block.value.label} />;

				case 'PLAIN_TEXT':
					return <PlainSpan key={index} text={block.value} />;

				case 'BOLD':
					return <BoldSpan key={index} children={block.value} />;

				case 'ITALIC':
					return <ItalicSpan key={index} children={block.value} />;

				default:
					return null;
			}
		})}
	</del>
);

export default StrikeSpan;
