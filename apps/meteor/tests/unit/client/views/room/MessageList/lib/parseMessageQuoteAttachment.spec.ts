/* eslint-env mocha */
import type { MessageQuoteAttachment } from '@rocket.chat/core-typings';
import type { Options, Root } from '@rocket.chat/message-parser';
import { expect } from 'chai';

import { parseMessageQuoteAttachment } from '../../../../../../../client/lib/parseMessageTextToAstMarkdown';

const parseOptions: Options = {
	colors: true,
	emoticons: true,
	katex: {
		dollarSyntax: true,
		parenthesisSyntax: true,
	},
};

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

const autoTranslateOptions = {
	autoTranslateEnabled: false,
	translated: false,
};

const quoteMessage = {
	author_name: 'authorName',
	author_link: 'link',
	author_icon: 'icon',
	text: 'message **bold** _italic_ and ~strike~',
	md: messageParserTokenMessage,
};

describe('parseMessageQuoteAttachment', () => {
	it('should return md property populated if the quote is parsed', () => {
		expect(parseMessageQuoteAttachment(quoteMessage, parseOptions, autoTranslateOptions).md).to.deep.equal(messageParserTokenMessage);
	});

	it('should return md property populated if the quote is not parsed', () => {
		expect(
			parseMessageQuoteAttachment(
				{ ...quoteMessage, md: undefined } as unknown as MessageQuoteAttachment,
				parseOptions,
				autoTranslateOptions,
			).md,
		).to.deep.equal(messageParserTokenMessage);
	});

	describe('translated', () => {
		const translatedQuote = {
			...quoteMessage,
			text: 'quote not translated',
			translationProvider: 'provider',
			translations: {
				en: 'quote translated',
			},
		};
		const translatedMessageParsed: Root = [
			{
				type: 'PARAGRAPH',
				value: [
					{
						type: 'PLAIN_TEXT',
						value: 'quote translated',
					},
				],
			},
		];

		const enabledAutoTranslatedOptions = {
			translated: true,
			autoTranslateLanguage: 'en',
		};
		it('should return correct quote translated parsed md when translate is active', () => {
			expect(parseMessageQuoteAttachment(translatedQuote, parseOptions, enabledAutoTranslatedOptions).md).to.deep.equal(
				translatedMessageParsed,
			);
		});

		it('should return text parsed md when translate is active and autoTranslateLanguage is undefined', () => {
			expect(
				parseMessageQuoteAttachment(translatedQuote, parseOptions, { ...enabledAutoTranslatedOptions, autoTranslateLanguage: undefined })
					.md,
			).to.deep.equal([
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: 'quote not translated',
						},
					],
				},
			]);
		});

		it('should return correct multiple attachment quote translated parsed md when translate is active', () => {
			const quote = { ...quoteMessage, text: 'text level 2', translations: { en: 'text level 2 translated' } };

			const multipleQuotes = {
				...translatedQuote,
				attachments: [
					{
						...translatedQuote,
						text: 'text',
						translations: {
							en: 'text translated',
						},
						attachments: [quote],
					},
				],
			};
			const multipleQuotesParsed = {
				...translatedQuote,
				md: translatedMessageParsed,
				attachments: [
					{
						...multipleQuotes.attachments[0],
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
								...quote,
								md: [
									{
										type: 'PARAGRAPH',
										value: [
											{
												type: 'PLAIN_TEXT',
												value: 'text level 2 translated',
											},
										],
									},
								],
							},
						],
					},
				],
			};

			expect(parseMessageQuoteAttachment(multipleQuotes, parseOptions, enabledAutoTranslatedOptions)).to.deep.equal(multipleQuotesParsed);
		});
	});
});
