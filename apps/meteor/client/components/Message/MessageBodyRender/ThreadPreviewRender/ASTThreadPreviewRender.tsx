import { MarkdownAST } from '@rocket.chat/message-parser';
import React, { FC, memo } from 'react';

import Heading from '../Heading';
import OrderedList from '../OrderedList';
import Quote from '../Quote';
import TaskList from '../TaskList';
import UnorderedList from '../UnorderedList';
import { MessageBodyContext } from '../contexts/MessageBodyContext';
import { ChannelMention } from '../definitions/ChannelMention';
import { UserMention } from '../definitions/UserMention';
import { isBigEmoji } from '../isBigEmoji';
import ThreadMessageEmoji from './ThreadMessageEmoji';
import ThreadPreviewCode from './ThreadPreviewCode';
import ThreadPreviewParagraph from './ThreadPreviewParagraph';

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
					return <UnorderedList value={block.value} key={index} />;
				}

				if (block.type === 'QUOTE') {
					return <Quote value={block.value} key={index} />;
				}

				if (block.type === 'TASKS') {
					return <TaskList value={block.value} key={index} />;
				}

				if (block.type === 'ORDERED_LIST') {
					return <OrderedList value={block.value} key={index} />;
				}

				if (block.type === 'PARAGRAPH') {
					return <ThreadPreviewParagraph value={block.value} key={index} />;
				}

				if (block.type === 'CODE') {
					return <ThreadPreviewCode {...block} key={index} />;
				}

				if (block.type === 'HEADING') {
					return <Heading value={block.value} level={block.level} key={index} />;
				}

				return null;
			})}
		</MessageBodyContext.Provider>
	);
};

export default memo(ASTThreadPreviewRender);
