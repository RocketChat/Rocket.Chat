import { BigEmoji as ASTBigEmoji, MarkdownAST as GazzodownAST } from '@rocket.chat/message-parser';
import React, { FC, memo } from 'react';

import BigEmoji from './BigEmoji';
import Code from './Code';
import Heading from './Heading';
import OrderedList from './OrderedList';
import Paragraph from './Paragraph';
import Quote from './Quote';
import TaskList from './TaskList';
import UnorderedList from './UnorderedList';
import { UserMention } from './definitions/UserMention';

type BodyProps = {
	tokens: GazzodownAST;
	mentions: UserMention[];
};

const isBigEmoji = (tokens: GazzodownAST): tokens is [ASTBigEmoji] => tokens.length === 1 && tokens[0].type === 'BIG_EMOJI';

const Body: FC<BodyProps> = ({ tokens, mentions }) => {
	if (isBigEmoji(tokens)) {
		return <BigEmoji value={tokens[0].value} />;
	}

	return (
		<>
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
					return <Paragraph mentions={mentions} value={block.value} key={index} />;
				}

				if (block.type === 'CODE') {
					return <Code {...block} key={index} />;
				}

				if (block.type === 'HEADING') {
					return <Heading value={block.value} key={index} />;
				}

				return null;
			})}
		</>
	);
};

export default memo(Body);
