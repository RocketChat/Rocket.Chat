import type * as MessageParser from '@rocket.chat/message-parser';
import type { SpoilerNode } from '@rocket.chat/message-parser';
import { lazy, memo, ReactElement } from 'react';

import HeadingBlock from './blocks/HeadingBlock';
import OrderedListBlock from './blocks/OrderedListBlock';
import ParagraphBlock from './blocks/ParagraphBlock';
import QuoteBlock from './blocks/QuoteBlock';
import TaskList from './blocks/TaskListBlock';
import UnorderedListBlock from './blocks/UnorderedListBlock';
import BigEmojiBlock from './emoji/BigEmojiBlock';
import KatexErrorBoundary from './katex/KatexErrorBoundary';

const CodeBlock = lazy(() => import('./code/CodeBlock'));
const KatexBlock = lazy(() => import('./katex/KatexBlock'));

type MarkupProps = {
	tokens: MessageParser.Root;
};

const Markup = ({ tokens }: MarkupProps): ReactElement => (
	<>
		{tokens.map((block, index) => {
			// Explicitly cast block to access type property,
			// and then further cast to SpoilerNode if type matches.
			const node = block as MessageParser.ASTNode;
			switch (node.type) {
				case 'BIG_EMOJI':
					return <BigEmojiBlock key={index} emoji={node.value as MessageParser.Emoji[]} />;

				case 'PARAGRAPH':
					return <ParagraphBlock key={index} children={node.value as MessageParser.Inlines[]} />;

				case 'HEADING': {
					const headingNode = node as MessageParser.Heading;
					return <HeadingBlock key={index} level={headingNode.level} children={headingNode.value} />;
				}
				case 'UNORDERED_LIST':
					return <UnorderedListBlock key={index} items={node.value as MessageParser.ListItem[]} />;

				case 'ORDERED_LIST':
					return <OrderedListBlock key={index} items={node.value as MessageParser.ListItem[]} />;

				case 'TASKS':
					return <TaskList key={index} tasks={node.value as MessageParser.Task[]} />;

				case 'QUOTE':
					return <QuoteBlock key={index} children={node.value as MessageParser.Paragraph[]} />;

				case 'CODE': {
					const codeNode = node as MessageParser.Code;
					return <CodeBlock key={index} language={codeNode.language} lines={codeNode.value} />;
				}
				case 'KATEX':
					return (
						<KatexErrorBoundary code={node.value as string} key={index}>
							<KatexBlock code={node.value as string} />
						</KatexErrorBoundary>
					);

				case 'LINE_BREAK':
					return <br key={index} />;

				case 'SPOILER': {
					const spoilerNode = node as SpoilerNode;
					return (
						<span key={index} className='rcx-spoiler'>
							{spoilerNode.value}
						</span>
					);
				}
				default:
					return null;
			}
		})}
	</>
);

export default memo(Markup);
