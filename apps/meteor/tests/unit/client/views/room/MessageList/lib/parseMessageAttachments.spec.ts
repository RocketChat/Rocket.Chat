/* eslint-env mocha */
import type { Options, Root } from '@rocket.chat/message-parser';
import { expect } from 'chai';

import { parseMessageAttachments } from '../../../../../../../client/lib/parseMessageTextToAstMarkdown';

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
		expect(parseMessageAttachments(attachmentMessage, parseOptions, autoTranslateOptions)[0].md).to.deep.equal(messageParserTokenMessage);
	});

	it('should return md property populated if the attachment is not parsed', () => {
		expect(parseMessageAttachments([{ ...attachmentMessage[0], md: undefined }], parseOptions, autoTranslateOptions)[0].md).to.deep.equal(
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

			expect(parseMessageAttachments(descriptionAttachment, parseOptions, enabledAutoTranslatedOptions)[0].md).to.deep.equal(
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
			).to.deep.equal(descriptionAttachmentParsed);
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

			expect(parseMessageAttachments(textAttachment, parseOptions, enabledAutoTranslatedOptions)[0].md).to.deep.equal(textAttachmentParsed);
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

			expect(parseMessageAttachments(textAttachment, parseOptions, enabledAutoTranslatedOptions)[0]).to.deep.equal(textAttachmentParsed);
		});
	});
});
