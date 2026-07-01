import type * as MessageParser from '@rocket.chat/message-parser';
import { memo } from 'react';

import PreviewCodeBlock from './code/PreviewCodeBlock';
import PreviewInlineElements from './elements/PreviewInlineElements';
import PreviewBigEmojiBlock from './emoji/PreviewBigEmojiBlock';
import KatexErrorBoundary from './katex/KatexErrorBoundary';
import PreviewKatexBlock from './katex/PreviewKatexBlock';

const isOnlyBigEmojiBlock = (tokens: MessageParser.Root): tokens is [MessageParser.BigEmoji] =>
	tokens.length === 1 && tokens[0].type === 'BIG_EMOJI';

type PreviewMarkupProps = {
	tokens: MessageParser.Root;
	/** Original message source, used to render the `fallback` of blocks without a dedicated renderer. */
	source?: string;
};

const PreviewMarkup = ({ tokens, source }: PreviewMarkupProps) => {
	if (isOnlyBigEmojiBlock(tokens)) {
		return <PreviewBigEmojiBlock emoji={tokens[0].value} />;
	}

	const firstBlock = tokens.find((block) => block.type !== 'LINE_BREAK');

	if (!firstBlock) {
		return null;
	}

	switch (firstBlock.type) {
		case 'PARAGRAPH':
			return <PreviewInlineElements>{firstBlock.value}</PreviewInlineElements>;

		case 'HEADING':
			return <PreviewInlineElements>{firstBlock.value}</PreviewInlineElements>;

		case 'UNORDERED_LIST':
		case 'ORDERED_LIST': {
			const firstItem = firstBlock.value[0];

			return (
				<>
					{firstItem.number ? `${firstItem.number}.` : '-'} <PreviewInlineElements>{firstItem.value}</PreviewInlineElements>
				</>
			);
		}

		case 'TASKS': {
			const firstTask = firstBlock.value[0];

			return (
				<>
					{firstTask.status ? '\u2611' : '\u2610'} <PreviewInlineElements>{firstTask.value}</PreviewInlineElements>
				</>
			);
		}

		case 'QUOTE': {
			const firstParagraph = firstBlock.value[0];

			return (
				<>
					&gt; <PreviewInlineElements>{firstParagraph.value}</PreviewInlineElements>
				</>
			);
		}

		case 'SPOILER_BLOCK': {
			return (
				<>
					{firstBlock.value.map((paragraph, index: number) => (
						<PreviewInlineElements key={index}>{paragraph.value}</PreviewInlineElements>
					))}
				</>
			);
		}

		case 'CODE': {
			return <PreviewCodeBlock language={firstBlock.language} lines={firstBlock.value} />;
		}

		case 'KATEX':
			return (
				<KatexErrorBoundary code={firstBlock.value}>
					<PreviewKatexBlock code={firstBlock.value} />
				</KatexErrorBoundary>
			);

		default: {
			// Only the `[start, end]` offset form is rendered (sliced from source); the union
			// keeps the original fallback form too, which we intentionally ignore.
			const { fallback } = firstBlock as { fallback?: [number, number] | MessageParser.Plain };
			if (Array.isArray(fallback) && source !== undefined) {
				const inlines: MessageParser.Inlines[] = [{ type: 'PLAIN_TEXT', value: source.slice(fallback[0], fallback[1]) }];
				return <PreviewInlineElements>{inlines}</PreviewInlineElements>;
			}
			return null;
		}
	}
};

export default memo(PreviewMarkup);
