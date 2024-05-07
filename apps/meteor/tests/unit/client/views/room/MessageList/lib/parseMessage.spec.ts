/* eslint-env mocha */
import type { IMessage, ITranslatedMessage } from '@rocket.chat/core-typings';
import type { Options, Root } from '@rocket.chat/message-parser';
import { expect } from 'chai';

import { parseMessageTextToAstMarkdown } from '../../../../../../../client/lib/parseMessageTextToAstMarkdown';

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

const autoTranslateOptions = {
	autoTranslateEnabled: false,
	showAutoTranslate: () => false,
};

const quoteMessage = {
	author_name: 'authorName',
	author_link: 'link',
	author_icon: 'icon',
	md: [],
};

describe('parseMessage', () => {
	it('should return md property populated if the message is parsed', () => {
		expect(parseMessageTextToAstMarkdown(baseMessage, parseOptions, autoTranslateOptions).md).to.deep.equal(messageParserTokenMessage);
	});

	it('should return correct parsed md property populated and fail in comparison with different Root element', () => {
		expect(parseMessageTextToAstMarkdown(baseMessage, parseOptions, autoTranslateOptions).md).to.not.deep.equal(
			messageParserTokenMessageWithWrongData,
		);
	});

	describe('translated', () => {
		const translatedMessage: ITranslatedMessage = {
			...baseMessage,
			msg: 'message not translated',
			translationProvider: 'provider',
			translations: {
				en: 'message translated',
			},
		};
		const translatedMessageParsed: Root = [
			{
				type: 'PARAGRAPH',
				value: [
					{
						type: 'PLAIN_TEXT',
						value: 'message translated',
					},
				],
			},
		];

		const enabledAutoTranslatedOptions = {
			autoTranslateEnabled: true,
			autoTranslateLanguage: 'en',
			showAutoTranslate: () => true,
		};
		it('should return correct translated parsed md when translate is active', () => {
			expect(parseMessageTextToAstMarkdown(translatedMessage, parseOptions, enabledAutoTranslatedOptions).md).to.deep.equal(
				translatedMessageParsed,
			);
		});

		it('should return correct attachment translated parsed md when translate is active', () => {
			const attachmentTranslatedMessage = {
				...translatedMessage,
				attachments: [
					{
						description: 'description',
						translations: {
							en: 'description translated',
						},
					},
				],
			};
			const attachmentTranslatedMessageParsed = {
				...translatedMessage,
				md: translatedMessageParsed,
				attachments: [
					{
						description: 'description',
						translations: {
							en: 'description translated',
						},
						md: [
							{
								type: 'PARAGRAPH',
								value: [
									{
										type: 'PLAIN_TEXT',
										value: 'description translated',
									},
								],
							},
						],
					},
				],
			};

			expect(parseMessageTextToAstMarkdown(attachmentTranslatedMessage, parseOptions, enabledAutoTranslatedOptions)).to.deep.equal(
				attachmentTranslatedMessageParsed,
			);
		});

		it('should return correct attachment quote translated parsed md when translate is active', () => {
			const attachmentTranslatedMessage = {
				...translatedMessage,
				attachments: [
					{
						text: 'text',
						translations: {
							en: 'text translated',
						},
					},
				],
			};
			const attachmentTranslatedMessageParsed = {
				...translatedMessage,
				md: translatedMessageParsed,
				attachments: [
					{
						text: 'text',
						translations: {
							en: 'text translated',
						},
						md: [
							{
								type: 'PARAGRAPH',
								value: [
									{
										type: 'PLAIN_TEXT',
										value: 'text translated',
									},
								],
							},
						],
					},
				],
			};

			expect(parseMessageTextToAstMarkdown(attachmentTranslatedMessage, parseOptions, enabledAutoTranslatedOptions)).to.deep.equal(
				attachmentTranslatedMessageParsed,
			);
		});

		it('should return correct multiple attachment quote translated parsed md when translate is active', () => {
			const attachmentTranslatedMessage = {
				...translatedMessage,
				attachments: [
					{
						text: 'text',
						translations: {
							en: 'text translated',
						},
						attachments: [{ ...quoteMessage, text: 'text level 2', translations: { en: 'text level 2 translated' } }],
					},
				],
			};
			const attachmentTranslatedMessageParsed = {
				...translatedMessage,
				md: translatedMessageParsed,
				attachments: [
					{
						text: 'text',
						translations: {
							en: 'text translated',
						},
						md: [
							{
								type: 'PARAGRAPH',
								value: [
									{
										type: 'PLAIN_TEXT',
										value: 'text translated',
									},
								],
							},
						],
						attachments: [
							{
								...quoteMessage,
								text: 'text level 2',
								translations: {
									en: 'text level 2 translated',
								},
							},
						],
					},
				],
			};

			expect(parseMessageTextToAstMarkdown(attachmentTranslatedMessage, parseOptions, enabledAutoTranslatedOptions)).to.deep.equal(
				attachmentTranslatedMessageParsed,
			);
		});
	});

	// TODO: Add more tests for each type of message and for each type of token
});
