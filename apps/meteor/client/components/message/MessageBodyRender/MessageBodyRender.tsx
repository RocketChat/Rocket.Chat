import * as MessageParser from '@rocket.chat/message-parser';
import React, { memo, MouseEvent, ReactElement } from 'react';

import BigEmojiBlock from './blocks/BigEmojiBlock';
import CodeBlock from './blocks/CodeBlock';
import HeadingBlock from './blocks/HeadingBlock';
import OrderedListBlock from './blocks/OrderedListBlock';
import ParagraphBlock from './blocks/ParagraphBlock';
import QuoteBlock from './blocks/QuoteBlock';
import TaskList from './blocks/TaskListBlock';
import UnorderedListBlock from './blocks/UnorderedListBlock';
import { MessageBodyContext } from './contexts/MessageBodyContext';
import { ChannelMention } from './definitions/ChannelMention';
import { UserMention } from './definitions/UserMention';

type MessageBodyRenderProps = {
	tokens: MessageParser.MarkdownAST;
	mentions: UserMention[];
	channels: ChannelMention[];
	onUserMentionClick?: (username: string) => (e: MouseEvent<HTMLDivElement>) => void;
	onChannelMentionClick?: (id: string) => (e: MouseEvent<HTMLDivElement>) => void;
	isThreadPreview?: boolean;
};

const MessageBodyRender = ({
	tokens,
	mentions = [],
	channels = [],
	onUserMentionClick,
	onChannelMentionClick,
	isThreadPreview,
}: MessageBodyRenderProps): ReactElement => (
	<MessageBodyContext.Provider value={{ mentions, channels, onUserMentionClick, onChannelMentionClick, isThreadPreview }}>
		{tokens.map((block, index) => {
			switch (block.type) {
				case 'BIG_EMOJI':
					return <BigEmojiBlock key={index} emojis={block.value} isThreadPreview={isThreadPreview} />;

				case 'PARAGRAPH':
					return <ParagraphBlock key={index} children={block.value} />;

				case 'HEADING':
					return <HeadingBlock key={index} level={block.level} children={block.value} />;

				case 'UNORDERED_LIST':
					return <UnorderedListBlock key={index} items={block.value} />;

				case 'ORDERED_LIST':
					return <OrderedListBlock key={index} items={block.value} />;

				case 'TASKS':
					return <TaskList key={index} tasks={block.value} />;

				case 'QUOTE':
					return <QuoteBlock key={index} children={block.value} />;

				case 'CODE':
					return <CodeBlock key={index} language={block.language} lines={block.value} />;

				case 'LINE_BREAK':
					return <br key={index} />;

				default:
					return null;
			}
		})}
	</MessageBodyContext.Provider>
);

export default memo(MessageBodyRender);
