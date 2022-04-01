import { BigEmoji as ASTBigEmoji, MarkdownAST } from '@rocket.chat/message-parser';
import React, { FC, memo, MouseEvent } from 'react';

import BigEmoji from './BigEmoji';
import Code from './Code';
import Heading from './Heading';
import OrderedList from './OrderedList';
import Paragraph from './Paragraph';
import Quote from './Quote';
import TaskList from './TaskList';
import UnorderedList from './UnorderedList';
import { MessageBodyContext } from './contexts/MessageBodyContext';
import { ChannelMention } from './definitions/ChannelMention';
import { UserMention } from './definitions/UserMention';

type BodyProps = {
	tokens: MarkdownAST;
	highlights:
		| {
				highlight: string;
				regex: RegExp;
				urlRegex: RegExp;
		  }[]
		| undefined;
	mentions: UserMention[];
	channels: ChannelMention[];
	onUserMentionClick?: (username: string) => (e: MouseEvent<HTMLDivElement>) => void;
	onChannelMentionClick?: (id: string) => (e: MouseEvent<HTMLDivElement>) => void;
};

const isBigEmoji = (tokens: MarkdownAST): tokens is [ASTBigEmoji] => tokens.length === 1 && tokens[0].type === 'BIG_EMOJI';

const MessageBodyRender: FC<BodyProps> = ({
	tokens,
	highlights,
	mentions = [],
	channels = [],
	onUserMentionClick,
	onChannelMentionClick,
}) => {
	if (isBigEmoji(tokens)) {
		return <BigEmoji value={tokens[0].value} />;
	}

	return (
		<MessageBodyContext.Provider value={{ highlights, mentions, channels, onUserMentionClick, onChannelMentionClick }}>
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
					return <Paragraph value={block.value} key={index} />;
				}

				if (block.type === 'CODE') {
					return <Code {...block} key={index} />;
				}

				if (block.type === 'HEADING') {
					return <Heading value={block.value} key={index} />;
				}

				return null;
			})}
		</MessageBodyContext.Provider>
	);
};

export default memo(MessageBodyRender);
