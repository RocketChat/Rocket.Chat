import * as MessageParser from '@rocket.chat/message-parser';
import React, { memo, ReactElement } from 'react';

import PreviewBigEmojiBlock from './blocks/PreviewBigEmojiBlock';
import PreviewInlineElements from './elements/PreviewInlineElements';

const isOnlyBigEmojiBlock = (tokens: MessageParser.MarkdownAST): tokens is [MessageParser.BigEmoji] =>
	tokens.length === 1 && tokens[0].type === 'BIG_EMOJI';

type PreviewMarkupProps = {
	tokens: MessageParser.MarkdownAST;
};

const PreviewMarkup = ({ tokens }: PreviewMarkupProps): ReactElement | null => {
	if (isOnlyBigEmojiBlock(tokens)) {
		return <PreviewBigEmojiBlock emojis={tokens[0].value} />;
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
			const firstLine = firstBlock.value.find((line) => line.value.value.trim());

			return firstLine ? <>{firstLine.value.value.trim()}</> : null;
		}

		default:
			return null;
	}
};

export default memo(PreviewMarkup);
