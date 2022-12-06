/* eslint-env mocha */
import type { Options, Root } from '@rocket.chat/message-parser';
import type { IMessage } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { parseMessageTextToAstMarkdown } from '../../../../../../../client/views/room/MessageList/lib/parseMessageTextToAstMarkdown';

const date = new Date('2021-10-27T00:00:00.000Z');

const parseOptions: Options = {
	colors: true,
	emoticons: true,
	katex: {
		dollarSyntax: true,
		parenthesisSyntax: true,
	},
};

const messageParserTokenMessageWithWrongData: Root = [
	{
		type: 'PARAGRAPH',
		value: [
			{
				type: 'PLAIN_TEXT',
				value: 'message',
			},
			{
				type: 'BOLD',
				value: [
					{
						type: 'PLAIN_TEXT',
						value: 'bold',
					},
				],
			},
			{
				type: 'PLAIN_TEXT',
				value: ' ',
			},
			{
				type: 'ITALIC',
				value: [
					{
						type: 'PLAIN_TEXT',
						value: 'italic',
					},
				],
			},
			{
				type: 'PLAIN_TEXT',
				value: ' and ',
			},
			{
				type: 'STRIKE',
				value: [
					{
						type: 'PLAIN_TEXT',
						value: 'strike',
					},
				],
			},
		],
	},
];

const messageParserTokenMessage: Root = [
	{
		type: 'PARAGRAPH',
		value: [
			{
				type: 'PLAIN_TEXT',
				value: 'message ',
			},
			{
				type: 'BOLD',
				value: [
					{
						type: 'PLAIN_TEXT',
						value: 'bold',
					},
				],
			},
			{
				type: 'PLAIN_TEXT',
				value: ' ',
			},
			{
				type: 'ITALIC',
				value: [
					{
						type: 'PLAIN_TEXT',
						value: 'italic',
					},
				],
			},
			{
				type: 'PLAIN_TEXT',
				value: ' and ',
			},
			{
				type: 'STRIKE',
				value: [
					{
						type: 'PLAIN_TEXT',
						value: 'strike',
					},
				],
			},
		],
	},
];

const baseMessage: IMessage = {
	ts: date,
	u: {
		_id: 'userId',
		name: 'userName',
		username: 'userName',
	},
	msg: 'message **bold** _italic_ and ~strike~',
	rid: 'roomId',
	_id: 'messageId',
	_updatedAt: date,
	urls: [],
};

describe('parseMessage', () => {
	it('should return md property populated if the message is parsed', () => {
		expect(parseMessageTextToAstMarkdown(baseMessage, parseOptions).md).to.deep.equal(messageParserTokenMessage);
	});

	it('should return correct parsed md property populated and fail in comparison with different Root element', () => {
		expect(parseMessageTextToAstMarkdown(baseMessage, parseOptions).md).to.not.deep.equal(messageParserTokenMessageWithWrongData);
	});

	// TODO: Add more tests for each type of message and for each type of token
});
