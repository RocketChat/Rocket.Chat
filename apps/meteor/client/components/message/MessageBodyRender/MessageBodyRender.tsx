import * as MessageParser from '@rocket.chat/message-parser';
import React, { memo, MouseEvent, ReactElement } from 'react';

import Code from './Code';
import OrderedList from './OrderedList';
import Quote from './Quote';
import TaskList from './TaskList';
import UnorderedList from './UnorderedList';
import BigEmojiBlock from './blocks/BigEmojiBlock';
import HeadingBlock from './blocks/HeadingBlock';
import ParagraphBlock from './blocks/ParagraphBlock';
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
					return <ParagraphBlock key={index} chunks={block.value} />;

				case 'HEADING':
					return <HeadingBlock key={index} chunks={block.value} level={block.level} />;

				case 'UNORDERED_LIST':
					return <UnorderedList key={index} value={block.value} />;

				case 'ORDERED_LIST':
					return <OrderedList key={index} value={block.value} />;

				case 'TASKS':
					return <TaskList key={index} value={block.value} />;

				case 'QUOTE':
					return <Quote key={index} value={block.value} />;

				case 'CODE':
					return <Code key={index} {...block} />;

				case 'LINE_BREAK':
					return <br key={index} />;

				default:
					return null;
			}
		})}
	</MessageBodyContext.Provider>
);

export default memo(MessageBodyRender);
