import { MarkdownAST } from '@rocket.chat/message-parser';
import React, { FC, memo } from 'react';

import Quote from '../Quote';
import { MessageBodyContext } from '../contexts/MessageBodyContext';
import { ChannelMention } from '../definitions/ChannelMention';
import { UserMention } from '../definitions/UserMention';
import { isBigEmoji } from '../isBigEmoji';
import ThreadMessageEmoji from './ThreadMessageEmoji';
import ThreadPreviewCode from './ThreadPreviewCode';
import ThreadPreviewHeading from './ThreadPreviewHeading';
import ThreadPreviewOrderedList from './ThreadPreviewOrderedList';
import ThreadPreviewParagraph from './ThreadPreviewParagraph';
import ThreadPreviewTaskList from './ThreadPreviewTaskList';
import ThreadPreviewUnorderedList from './ThreadPreviewUnorderedList';

type ASTThreadPreviewRenderProps = {
	tokens: MarkdownAST;
	mentions: UserMention[];
	channels: ChannelMention[];
};

const ASTThreadPreviewRender: FC<ASTThreadPreviewRenderProps> = ({ tokens, mentions = [], channels = [] }) => {
	if (isBigEmoji(tokens)) {
		return (
			<>
				{tokens[0].value.map((block, index) => (
					<ThreadMessageEmoji emojiHandle={`:${block.value.value}:`} key={index} />
				))}
			</>
		);
	}

	return (
		<MessageBodyContext.Provider value={{ mentions, channels }}>
			{tokens.map((block, index) => {
				if (block.type === 'UNORDERED_LIST') {
					return <ThreadPreviewUnorderedList value={block.value} key={index} />;
				}

				if (block.type === 'QUOTE') {
					return <Quote value={block.value} key={index} />;
				}

				if (block.type === 'TASKS') {
					return <ThreadPreviewTaskList value={block.value} key={index} />;
				}

				if (block.type === 'ORDERED_LIST') {
					return <ThreadPreviewOrderedList value={block.value} key={index} />;
				}

				if (block.type === 'PARAGRAPH') {
					return <ThreadPreviewParagraph value={block.value} key={index} />;
				}

				if (block.type === 'CODE') {
					return <ThreadPreviewCode {...block} key={index} />;
				}

				if (block.type === 'HEADING') {
					return <ThreadPreviewHeading value={block.value} key={index} />;
				}

				if (block.type === 'LINE_BREAK') {
					return ' ';
				}

				return null;
			})}
		</MessageBodyContext.Provider>
	);
};

export default memo(ASTThreadPreviewRender);
