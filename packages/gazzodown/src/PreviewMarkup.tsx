import type * as MessageParser from '@rocket.chat/message-parser';
import { memo, ReactElement } from 'react';

import PreviewCodeBlock from './code/PreviewCodeBlock';
import PreviewInlineElements from './elements/PreviewInlineElements';
import PreviewBigEmojiBlock from './emoji/PreviewBigEmojiBlock';
import KatexErrorBoundary from './katex/KatexErrorBoundary';
import PreviewKatexBlock from './katex/PreviewKatexBlock';

const isOnlyBigEmojiBlock = (tokens: MessageParser.Root): tokens is [MessageParser.BigEmoji] =>
	tokens.length === 1 && tokens[0].type === 'BIG_EMOJI';

type PreviewMarkupProps = {
	tokens: MessageParser.Root;
};

const PreviewMarkup = ({ tokens }: PreviewMarkupProps): ReactElement | null => {
	if (isOnlyBigEmojiBlock(tokens)) {
		return <PreviewBigEmojiBlock emoji={tokens[0].value} />;
	}

	const firstBlock = tokens.find((block) => block.type !== 'LINE_BREAK');

	if (!firstBlock) {
		return null;
	}

	switch (firstBlock.type) {
		case 'PARAGRAPH':
			return <PreviewInlineElements children={firstBlock.value} />;

		case 'HEADING':
			return <>{firstBlock.value.map((plain) => plain.value).join('')}</>;

		case 'UNORDERED_LIST':
		case 'ORDERED_LIST': {
			const firstItem = firstBlock.value[0];

			return (
				<>
					{firstItem.number ? `${firstItem.number}.` : '-'} <PreviewInlineElements children={firstItem.value} />
				</>
			);
		}

		case 'TASKS': {
			const firstTask = firstBlock.value[0];

			return (
				<>
					{firstTask.status ? '\u2611' : '\u2610'} <PreviewInlineElements children={firstTask.value} />
				</>
			);
		}

		case 'QUOTE': {
			const firstParagraph = firstBlock.value[0];

			return (
				<>
					&gt; <PreviewInlineElements children={firstParagraph.value} />
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

		default:
			return null;
	}
};

export default memo(PreviewMarkup);
