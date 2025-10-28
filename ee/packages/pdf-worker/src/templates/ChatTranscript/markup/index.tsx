import type * as MessageParser from '@rocket.chat/message-parser';

import BigEmojiBlock from './blocks/BigEmojiBlock';
import CodeBlock from './blocks/CodeBlock';
import HeadingBlock from './blocks/HeadingBlock';
import OrderedListBlock from './blocks/OrderedListBlock';
import ParagraphBlock from './blocks/ParagraphBlock';
import UnorderedListBlock from './blocks/UnorderedListBlock';

type MarkupProps = {
	tokens: MessageParser.Root;
};

export const Markup = ({ tokens }: MarkupProps) => (
	<>
		{tokens
			.map((child, index) => {
				switch (child.type) {
					case 'PARAGRAPH':
						return <ParagraphBlock key={index} items={child.value} />;

					case 'HEADING':
						return <HeadingBlock key={index} level={child.level} items={child.value} />;

					case 'UNORDERED_LIST':
						return <UnorderedListBlock key={index} items={child.value} />;

					case 'ORDERED_LIST':
						return <OrderedListBlock key={index} items={child.value} />;

					case 'BIG_EMOJI':
						return <BigEmojiBlock key={index} emoji={child.value} />;

					case 'CODE':
						return <CodeBlock key={index} lines={child.value} />;

					default:
						return null;
				}
			})
			.filter(Boolean)}
	</>
);
