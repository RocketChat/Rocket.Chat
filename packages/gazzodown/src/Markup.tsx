import type * as MessageParser from '@rocket.chat/message-parser';
import { lazy, memo } from 'react';

import HeadingBlock from './blocks/HeadingBlock';
import OrderedListBlock from './blocks/OrderedListBlock';
import ParagraphBlock from './blocks/ParagraphBlock';
import QuoteBlock from './blocks/QuoteBlock';
import SpoilerBlock from './blocks/SpoilerBlock';
import TaskList from './blocks/TaskListBlock';
import UnorderedListBlock from './blocks/UnorderedListBlock';
import BigEmojiBlock from './emoji/BigEmojiBlock';
import KatexErrorBoundary from './katex/KatexErrorBoundary';

const CodeBlock = lazy(() => import('./code/CodeBlock'));
const KatexBlock = lazy(() => import('./katex/KatexBlock'));

type MarkupProps = {
	tokens: MessageParser.Root;
	/** Original message source, used to render the `fallback` of blocks without a dedicated renderer. */
	source?: string;
};

const Markup = ({ tokens, source }: MarkupProps) => (
	<>
		{tokens.map((block, index) => {
			switch (block.type) {
				case 'BIG_EMOJI':
					return <BigEmojiBlock key={index} emoji={block.value} />;

				case 'PARAGRAPH':
					return <ParagraphBlock key={index}>{block.value}</ParagraphBlock>;

				case 'HEADING':
					return (
						<HeadingBlock key={index} level={block.level}>
							{block.value}
						</HeadingBlock>
					);

				case 'UNORDERED_LIST':
					return <UnorderedListBlock key={index} items={block.value} />;

				case 'ORDERED_LIST':
					return <OrderedListBlock key={index} items={block.value} />;

				case 'TASKS':
					return <TaskList key={index} tasks={block.value} />;

				case 'QUOTE':
					return <QuoteBlock key={index}>{block.value}</QuoteBlock>;

				case 'SPOILER_BLOCK':
					return <SpoilerBlock key={index}>{block.value}</SpoilerBlock>;

				case 'CODE':
					return <CodeBlock key={index} language={block.language} lines={block.value} />;

				case 'KATEX':
					return (
						<KatexErrorBoundary code={block.value} key={index}>
							<KatexBlock code={block.value} />
						</KatexErrorBoundary>
					);

				case 'LINE_BREAK':
					return <br key={index} />;

				default: {
					// Graceful degradation: blocks may carry a `fallback`. The current form is a
					// `[start, end]` offset span into the source (sliced to render the raw markup);
					// the union keeps the original form too, which we intentionally ignore.
					const { fallback } = block as { fallback?: [number, number] | MessageParser.Plain };
					if (Array.isArray(fallback) && source !== undefined) {
						const inlines: MessageParser.Inlines[] = [{ type: 'PLAIN_TEXT', value: source.slice(fallback[0], fallback[1]) }];
						return <ParagraphBlock key={index}>{inlines}</ParagraphBlock>;
					}
					return null;
				}
			}
		})}
	</>
);

export default memo(Markup);
