import { expect } from 'chai';
import { describe, it } from 'mocha';

import { extractUrlsFromMessageAST } from './extractUrlsFromMessageAST';

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
