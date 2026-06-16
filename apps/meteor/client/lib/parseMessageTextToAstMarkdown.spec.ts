import type { IMessage, ITranslatedMessage } from '@rocket.chat/core-typings';
import type { Options, Root } from '@rocket.chat/message-parser';

import { getMarkdownParserLimit } from './getMarkdownParserLimit';
import { parseMessageAttachments, parseMessageTextToAstMarkdown } from './parseMessageTextToAstMarkdown';

jest.mock('./getMarkdownParserLimit');

const mockedGetMarkdownParserLimit = jest.mocked(getMarkdownParserLimit);

describe('parseMessageTextToAstMarkdown', () => {
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

	it('should return md property populated if the message is parsed', () => {
		expect(parseMessageTextToAstMarkdown(baseMessage, parseOptions, autoTranslateOptions).md).toStrictEqual(messageParserTokenMessage);
	});

	it('should return correct parsed md property populated and fail in comparison with different Root element', () => {
		expect(parseMessageTextToAstMarkdown(baseMessage, parseOptions, autoTranslateOptions).md).not.toStrictEqual(
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
			expect(parseMessageTextToAstMarkdown(translatedMessage, parseOptions, enabledAutoTranslatedOptions).md).toStrictEqual(
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

			expect(parseMessageTextToAstMarkdown(attachmentTranslatedMessage, parseOptions, enabledAutoTranslatedOptions)).toStrictEqual(
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

			expect(parseMessageTextToAstMarkdown(attachmentTranslatedMessage, parseOptions, enabledAutoTranslatedOptions)).toStrictEqual(
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

			expect(parseMessageTextToAstMarkdown(attachmentTranslatedMessage, parseOptions, enabledAutoTranslatedOptions)).toStrictEqual(
				attachmentTranslatedMessageParsed,
			);
		});
	});

	// TODO: Add more tests for each type of message and for each type of token
});

describe('parseMessageAttachments', () => {
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

	const attachmentMessage = [
		{
			description: 'message **bold** _italic_ and ~strike~',
			md: messageParserTokenMessage,
		},
	];

	describe('parseMessageAttachments', () => {
		it('should return md property populated if the message is parsed', () => {
			expect(parseMessageAttachments(attachmentMessage, parseOptions, autoTranslateOptions)[0].md).toStrictEqual(messageParserTokenMessage);
		});

		it('should return md property populated if the attachment is not parsed', () => {
			expect(parseMessageAttachments([{ ...attachmentMessage[0], md: undefined }], parseOptions, autoTranslateOptions)[0].md).toStrictEqual(
				messageParserTokenMessage,
			);
		});

		describe('translated', () => {
			const enabledAutoTranslatedOptions = {
				translated: true,
				autoTranslateLanguage: 'en',
			};

			it('should return correct attachment description translated parsed md when translate is active', () => {
				const descriptionAttachment = [
					{
						...attachmentMessage[0],
						description: 'attachment not translated',
						translationProvider: 'provider',
						translations: {
							en: 'attachment translated',
						},
					},
				];
				const descriptionAttachmentParsed: Root = [
					{
						type: 'PARAGRAPH',
						value: [
							{
								type: 'PLAIN_TEXT',
								value: 'attachment translated',
							},
						],
					},
				];

				expect(parseMessageAttachments(descriptionAttachment, parseOptions, enabledAutoTranslatedOptions)[0].md).toStrictEqual(
					descriptionAttachmentParsed,
				);
			});

			it('should return correct attachment description parsed md when translate is active and auto translate language is undefined', () => {
				const descriptionAttachment = [
					{
						...attachmentMessage[0],
						description: 'attachment not translated',
						translationProvider: 'provider',
						translations: {
							en: 'attachment translated',
						},
					},
				];
				const descriptionAttachmentParsed: Root = [
					{
						type: 'PARAGRAPH',
						value: [
							{
								type: 'PLAIN_TEXT',
								value: 'attachment not translated',
							},
						],
					},
				];

				expect(
					parseMessageAttachments(descriptionAttachment, parseOptions, {
						...enabledAutoTranslatedOptions,
						autoTranslateLanguage: undefined,
					})[0].md,
				).toStrictEqual(descriptionAttachmentParsed);
			});

			it('should return correct attachment text translated parsed md when translate is active', () => {
				const textAttachment = [
					{
						...attachmentMessage[0],
						text: 'attachment not translated',
						translationProvider: 'provider',
						translations: {
							en: 'attachment translated',
						},
					},
				];
				const textAttachmentParsed: Root = [
					{
						type: 'PARAGRAPH',
						value: [
							{
								type: 'PLAIN_TEXT',
								value: 'attachment translated',
							},
						],
					},
				];

				expect(parseMessageAttachments(textAttachment, parseOptions, enabledAutoTranslatedOptions)[0].md).toStrictEqual(
					textAttachmentParsed,
				);
			});

			it('should return correct attachment text translated parsed md when translate is active and has multiple texts', () => {
				const quote = {
					author_name: 'authorName',
					author_link: 'link',
					author_icon: 'icon',
					message_link: 'messageLink',
					md: [],
					text: 'text level 2',
					translations: { en: 'text level 2 translated' },
				};
				const textAttachment = [
					{
						...quote,
						text: 'attachment not translated',
						translationProvider: 'provider',
						translations: {
							en: 'attachment translated',
						},
						attachments: [quote],
					},
				];
				const textAttachmentParsed = {
					...textAttachment[0],
					md: [
						{
							type: 'PARAGRAPH',
							value: [
								{
									type: 'PLAIN_TEXT',
									value: 'attachment translated',
								},
							],
						},
					],
					attachments: [
						{
							...quote,
							text: 'text level 2',
							translations: {
								en: 'text level 2 translated',
							},
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
				};

				expect(parseMessageAttachments(textAttachment, parseOptions, enabledAutoTranslatedOptions)[0]).toStrictEqual(textAttachmentParsed);
			});
		});
	});
});

describe('parser limit handling', () => {
	const parseOptions: Options = {
		colors: true,
		emoticons: true,
		katex: {
			dollarSyntax: true,
			parenthesisSyntax: true,
		},
	};

	const date = new Date('2021-10-27T00:00:00.000Z');

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

	beforeEach(() => {
		mockedGetMarkdownParserLimit.mockReturnValue(Infinity);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should return plain text AST when message exceeds parser limit', () => {
		mockedGetMarkdownParserLimit.mockReturnValue(10);

		const result = parseMessageTextToAstMarkdown(baseMessage, parseOptions, autoTranslateOptions);

		expect(result.md).toStrictEqual([{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: baseMessage.msg }] }]);
	});

	it('should return plain text AST for attachment text exceeding parser limit', () => {
		mockedGetMarkdownParserLimit.mockReturnValue(10);

		const messageWithAttachment = {
			...baseMessage,
			msg: 'short',
			attachments: [{ text: 'this attachment text is definitely longer than the limit' }],
		};

		const result = parseMessageTextToAstMarkdown(messageWithAttachment, parseOptions, autoTranslateOptions);

		expect(result.attachments?.[0].md).toStrictEqual([
			{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'this attachment text is definitely longer than the limit' }] },
		]);
	});

	it('should parse normally when message is within the limit', () => {
		mockedGetMarkdownParserLimit.mockReturnValue(Infinity);

		const result = parseMessageTextToAstMarkdown(baseMessage, parseOptions, autoTranslateOptions);

		// Parsed result has BOLD, ITALIC, STRIKE — not just PLAIN_TEXT
		expect(result.md).not.toStrictEqual([{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: baseMessage.msg }] }]);
		expect(result.md[0].type).toBe('PARAGRAPH');
	});

	it('should return existing md when message already has md and is not translated', () => {
		mockedGetMarkdownParserLimit.mockReturnValue(10);

		const existingMd: Root = [{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'pre-parsed' }] }];
		const messageWithMd = { ...baseMessage, md: existingMd };

		const result = parseMessageTextToAstMarkdown(messageWithMd, parseOptions, autoTranslateOptions);

		expect(result.md).toBe(existingMd);
	});
});
