import type { Root } from '@rocket.chat/message-parser';
import { expect } from 'chai';

import { extractMentionsFromMessageAST } from '../../../../../../app/lib/server/functions/extractMentionsFromMessageAST';

describe('extractMentionsFromMessageAST', () => {
	it('should return empty arrays when AST has no mentions', () => {
		const ast: Root = [
			{
				type: 'PARAGRAPH',
				value: [
					{
						type: 'PLAIN_TEXT',
						value: 'Hello world',
					},
				],
			},
		];

		const result = extractMentionsFromMessageAST(ast);

		expect(result.mentions).to.be.an('array').that.is.empty;
		expect(result.channels).to.be.an('array').that.is.empty;
	});

	it('should extract user mentions from AST', () => {
		const ast: Root = [
			{
				type: 'PARAGRAPH',
				value: [
					{
						type: 'PLAIN_TEXT',
						value: 'Hello ',
					},
					{
						type: 'MENTION_USER',
						value: {
							type: 'PLAIN_TEXT',
							value: 'john.doe',
						},
					},
				],
			},
		];

		const result = extractMentionsFromMessageAST(ast);

		expect(result.mentions).to.deep.equal(['john.doe']);
		expect(result.channels).to.be.an('array').that.is.empty;
	});

	it('should extract channel mentions from AST', () => {
		const ast: Root = [
			{
				type: 'PARAGRAPH',
				value: [
					{
						type: 'PLAIN_TEXT',
						value: 'Check ',
					},
					{
						type: 'MENTION_CHANNEL',
						value: {
							type: 'PLAIN_TEXT',
							value: 'general',
						},
					},
				],
			},
		];

		const result = extractMentionsFromMessageAST(ast);

		expect(result.mentions).to.be.an('array').that.is.empty;
		expect(result.channels).to.deep.equal(['general']);
	});

	it('should extract both user and channel mentions', () => {
		const ast: Root = [
			{
				type: 'PARAGRAPH',
				value: [
					{
						type: 'MENTION_USER',
						value: {
							type: 'PLAIN_TEXT',
							value: 'admin',
						},
					},
					{
						type: 'PLAIN_TEXT',
						value: ' please check ',
					},
					{
						type: 'MENTION_CHANNEL',
						value: {
							type: 'PLAIN_TEXT',
							value: 'support',
						},
					},
				],
			},
		];

		const result = extractMentionsFromMessageAST(ast);

		expect(result.mentions).to.deep.equal(['admin']);
		expect(result.channels).to.deep.equal(['support']);
	});

	it('should extract multiple user mentions', () => {
		const ast: Root = [
			{
				type: 'PARAGRAPH',
				value: [
					{
						type: 'MENTION_USER',
						value: {
							type: 'PLAIN_TEXT',
							value: 'user1',
						},
					},
					{
						type: 'PLAIN_TEXT',
						value: ' and ',
					},
					{
						type: 'MENTION_USER',
						value: {
							type: 'PLAIN_TEXT',
							value: 'user2',
						},
					},
				],
			},
		];

		const result = extractMentionsFromMessageAST(ast);

		expect(result.mentions).to.have.members(['user1', 'user2']);
		expect(result.mentions).to.have.lengthOf(2);
	});

	it('should deduplicate repeated mentions', () => {
		const ast: Root = [
			{
				type: 'PARAGRAPH',
				value: [
					{
						type: 'MENTION_USER',
						value: {
							type: 'PLAIN_TEXT',
							value: 'admin',
						},
					},
					{
						type: 'PLAIN_TEXT',
						value: ' hello ',
					},
					{
						type: 'MENTION_USER',
						value: {
							type: 'PLAIN_TEXT',
							value: 'admin',
						},
					},
				],
			},
		];

		const result = extractMentionsFromMessageAST(ast);

		expect(result.mentions).to.deep.equal(['admin']);
	});

	it('should extract mentions from nested structures like blockquotes', () => {
		const ast: Root = [
			{
				type: 'QUOTE',
				value: [
					{
						type: 'PARAGRAPH',
						value: [
							{
								type: 'MENTION_USER',
								value: {
									type: 'PLAIN_TEXT',
									value: 'quoted.user',
								},
							},
						],
					},
				],
			},
		];

		const result = extractMentionsFromMessageAST(ast);

		expect(result.mentions).to.deep.equal(['quoted.user']);
	});

	it('should extract mentions from bold text', () => {
		const ast: Root = [
			{
				type: 'PARAGRAPH',
				value: [
					{
						type: 'BOLD',
						value: [
							{
								type: 'MENTION_USER',
								value: {
									type: 'PLAIN_TEXT',
									value: 'bold.user',
								},
							},
						],
					},
				],
			},
		];

		const result = extractMentionsFromMessageAST(ast);

		expect(result.mentions).to.deep.equal(['bold.user']);
	});

	it('should extract mentions from italic text', () => {
		const ast: Root = [
			{
				type: 'PARAGRAPH',
				value: [
					{
						type: 'ITALIC',
						value: [
							{
								type: 'MENTION_CHANNEL',
								value: {
									type: 'PLAIN_TEXT',
									value: 'italic-channel',
								},
							},
						],
					},
				],
			},
		];

		const result = extractMentionsFromMessageAST(ast);

		expect(result.channels).to.deep.equal(['italic-channel']);
	});

	it('should handle special mentions like all and here', () => {
		const ast: Root = [
			{
				type: 'PARAGRAPH',
				value: [
					{
						type: 'MENTION_USER',
						value: {
							type: 'PLAIN_TEXT',
							value: 'all',
						},
					},
					{
						type: 'PLAIN_TEXT',
						value: ' and ',
					},
					{
						type: 'MENTION_USER',
						value: {
							type: 'PLAIN_TEXT',
							value: 'here',
						},
					},
				],
			},
		];

		const result = extractMentionsFromMessageAST(ast);

		expect(result.mentions).to.have.members(['all', 'here']);
	});

	it('should handle empty AST', () => {
		const ast: Root = [];

		const result = extractMentionsFromMessageAST(ast);

		expect(result.mentions).to.be.an('array').that.is.empty;
		expect(result.channels).to.be.an('array').that.is.empty;
	});

	it('should extract mentions from list items', () => {
		const ast: Root = [
			{
				type: 'UNORDERED_LIST',
				value: [
					{
						type: 'LIST_ITEM',
						value: [
							{
								type: 'MENTION_USER',
								value: {
									type: 'PLAIN_TEXT',
									value: 'list.user',
								},
							},
						],
					},
				],
			},
		];

		const result = extractMentionsFromMessageAST(ast);

		expect(result.mentions).to.deep.equal(['list.user']);
	});

	it('should extract mentions from tasks', () => {
		const ast: Root = [
			{
				type: 'TASKS',
				value: [
					{
						type: 'TASK',
						status: false,
						value: [
							{
								type: 'MENTION_USER',
								value: {
									type: 'PLAIN_TEXT',
									value: 'task.assignee',
								},
							},
						],
					},
				],
			},
		];

		const result = extractMentionsFromMessageAST(ast);

		expect(result.mentions).to.deep.equal(['task.assignee']);
	});

	it('should handle BigEmoji AST structure', () => {
		const ast: Root = [
			{
				type: 'BIG_EMOJI',
				value: [
					{
						type: 'EMOJI',
						value: {
							type: 'PLAIN_TEXT',
							value: 'smile',
						},
						shortCode: ':smile:',
					},
				],
			},
		];

		const result = extractMentionsFromMessageAST(ast);

		expect(result.mentions).to.be.an('array').that.is.empty;
		expect(result.channels).to.be.an('array').that.is.empty;
	});

	it('should extract mentions from spoiler blocks', () => {
		const ast: Root = [
			{
				type: 'SPOILER_BLOCK',
				value: [
					{
						type: 'PARAGRAPH',
						value: [
							{
								type: 'MENTION_USER',
								value: {
									type: 'PLAIN_TEXT',
									value: 'hidden.user',
								},
							},
						],
					},
				],
			},
		];

		const result = extractMentionsFromMessageAST(ast);

		expect(result.mentions).to.deep.equal(['hidden.user']);
	});
});
