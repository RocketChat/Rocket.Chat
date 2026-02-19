import { expect } from 'chai';
import { describe, it } from 'mocha';

import { extractUrlsFromMessageAST, extractTextFromBlocks } from './extractTextFromBlocks';

describe('extractUrlsFromMessageAST', () => {
	it('should extract URLs from LINK nodes', () => {
		const md = [
			{
				type: 'PARAGRAPH',
				value: [
					{
						type: 'LINK',
						value: {
							src: {
								type: 'PLAIN_TEXT',
								value: 'https://rocket.chat',
							},
							label: [
								{
									type: 'PLAIN_TEXT',
									value: 'rocket.chat',
								},
							],
						},
					},
				],
			},
		];

		const urls = extractUrlsFromMessageAST(md as any);
		expect(urls).to.deep.equal(['https://rocket.chat']);
	});

	it('should convert // prefix to https://', () => {
		const md = [
			{
				type: 'PARAGRAPH',
				value: [
					{
						type: 'LINK',
						value: {
							src: {
								type: 'PLAIN_TEXT',
								value: '//github.com/RocketChat/Rocket.Chat',
							},
							label: [
								{
									type: 'PLAIN_TEXT',
									value: 'github.com/RocketChat/Rocket.Chat',
								},
							],
						},
					},
				],
			},
		];

		const urls = extractUrlsFromMessageAST(md as any);
		expect(urls).to.deep.equal(['https://github.com/RocketChat/Rocket.Chat']);
	});

	it('should handle multiple links', () => {
		const md = [
			{
				type: 'PARAGRAPH',
				value: [
					{
						type: 'LINK',
						value: {
							src: {
								type: 'PLAIN_TEXT',
								value: 'https://rocket.chat',
							},
							label: [
								{
									type: 'PLAIN_TEXT',
									value: 'rocket.chat',
								},
							],
						},
					},
					{
						type: 'PLAIN_TEXT',
						value: ' and ',
					},
					{
						type: 'LINK',
						value: {
							src: {
								type: 'PLAIN_TEXT',
								value: '//github.com/RocketChat',
							},
							label: [
								{
									type: 'PLAIN_TEXT',
									value: 'github.com/RocketChat',
								},
							],
						},
					},
				],
			},
		];

		const urls = extractUrlsFromMessageAST(md as any);
		expect(urls).to.deep.equal(['https://rocket.chat', 'https://github.com/RocketChat']);
	});

	it('should return empty array for undefined or non-array input', () => {
		expect(extractUrlsFromMessageAST(undefined)).to.deep.equal([]);
		expect(extractUrlsFromMessageAST(null as any)).to.deep.equal([]);
		expect(extractUrlsFromMessageAST({} as any)).to.deep.equal([]);
	});
});

describe('extractTextFromBlocks', () => {
	it('should extract text from plain_text blocks', () => {
		const blocks = [
			{
				type: 'section',
				text: {
					type: 'plain_text',
					text: 'Hello World',
				},
			},
		];

		const texts = extractTextFromBlocks(blocks as any);
		expect(texts).to.deep.equal(['Hello World']);
	});

	it('should extract text from mrkdwn blocks', () => {
		const blocks = [
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: 'Check out https://rocket.chat',
				},
			},
		];

		const texts = extractTextFromBlocks(blocks as any);
		expect(texts).to.deep.equal(['Check out https://rocket.chat']);
	});

	it('should extract text from multiple blocks and nested elements', () => {
		const blocks = [
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: 'First block',
				},
			},
			{
				type: 'context',
				elements: [
					{
						type: 'plain_text',
						text: 'Second block element 1',
					},
					{
						type: 'mrkdwn',
						text: 'Second block element 2',
					},
				],
			},
		];

		const texts = extractTextFromBlocks(blocks as any);
		expect(texts).to.deep.equal(['First block', 'Second block element 1', 'Second block element 2']);
	});

	it('should return empty array for undefined or non-array input', () => {
		expect(extractTextFromBlocks(undefined)).to.deep.equal([]);
		expect(extractTextFromBlocks(null as any)).to.deep.equal([]);
		expect(extractTextFromBlocks({} as any)).to.deep.equal([]);
	});
});
