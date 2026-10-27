import {
	compactify,
	expand,
	validateRoundtrip,
	calculateCompressionRatio,
	type CompactRoot,
} from '../src/compactAst';
import type { Root } from '../src/definitions';
import {
	paragraph,
	bold,
	italic,
	strike,
	spoiler,
	inlineCode,
	plain,
	mentionUser,
	mentionChannel,
	heading,
	code,
	codeLine,
	quote,
	blockquote,
	spoilerBlock,
	orderedList,
	unorderedList,
	listItem,
	tasks,
	task,
	emoji,
	emojiUnicode,
	emoticon,
	bigEmoji,
	katex,
	inlineKatex,
	color,
	lineBreak,
	horizontalRule,
	table,
	tableRow,
	tableCell,
	link,
	image,
} from './helpers';

describe('Compact AST format for message-parser', () => {
	describe('Core RFC Proposal Example', () => {
		it('compacts "**hello** world" and roundtrips losslessly', () => {
			const msg = '**hello** world';
			const ast: Root = [
				paragraph([
					bold([plain('hello')]),
					plain(' world'),
				]),
			];

			const compact = compactify(ast, msg);
			expect(compact).toEqual([
				{
					t: 'p',
					c: [
						{ t: 'b', c: [[2, 7]] },
						[9, 15], // index 9 to 15 is " world" in "**hello** world"
					],
				},
			]);

			expect(validateRoundtrip(ast, msg)).toBe(true);
			const restored = expand(compact, msg);
			expect(restored).toEqual(ast);
		});

		it('demonstrates significant payload size reduction (30-60%+)', () => {
			const msg = '**Important:** Please check *#announcements* and update ~old docs~ right away!';
			const ast: Root = [
				paragraph([
					bold([plain('Important:')]),
					plain(' Please check '),
					italic([mentionChannel('announcements')]),
					plain(' and update '),
					strike([plain('old docs')]),
					plain(' right away!'),
				]),
			];

			const compact = compactify(ast, msg);
			const stats = calculateCompressionRatio(ast, compact);

			expect(stats.percentReduction).toBeGreaterThan(40);
			expect(validateRoundtrip(ast, msg)).toBe(true);
		});
	});

	describe('Inline Formatting', () => {
		it('handles bold, italic, strike, and spoiler', () => {
			const msg = '**bold** *italic* ~strike~ ||spoiler||';
			const ast: Root = [
				paragraph([
					bold([plain('bold')]),
					plain(' '),
					italic([plain('italic')]),
					plain(' '),
					strike([plain('strike')]),
					plain(' '),
					spoiler([plain('spoiler')]),
				]),
			];

			expect(validateRoundtrip(ast, msg)).toBe(true);
			const compact = compactify(ast, msg);
			expect(expand(compact, msg)).toEqual(ast);
		});

		it('handles deeply nested inline markup', () => {
			const msg = '***~nested text~***';
			const ast: Root = [
				paragraph([
					bold([
						italic([
							strike([plain('nested text')]),
						]),
					]),
				]),
			];

			expect(validateRoundtrip(ast, msg)).toBe(true);
		});

		it('handles inline code, user mentions, and channel mentions', () => {
			const msg = 'Hey @alex check `const x = 10` in #dev';
			const ast: Root = [
				paragraph([
					plain('Hey '),
					mentionUser('alex'),
					plain(' check '),
					inlineCode(plain('const x = 10')),
					plain(' in '),
					mentionChannel('dev'),
				]),
			];

			expect(validateRoundtrip(ast, msg)).toBe(true);
			const compact = compactify(ast, msg);
			const restored = expand(compact, msg);
			expect(restored).toEqual(ast);
		});

		it('handles links and images', () => {
			const msg = 'Check [Rocket.Chat](https://rocket.chat) and ![Logo](https://rocket.chat/logo.png)';
			const ast: Root = [
				paragraph([
					plain('Check '),
					link('https://rocket.chat', [plain('Rocket.Chat')]),
					plain(' and '),
					image('https://rocket.chat/logo.png', plain('Logo')),
				]),
			];

			expect(validateRoundtrip(ast, msg)).toBe(true);
		});

		it('handles inline KaTeX and block KaTeX', () => {
			const msg = 'Formula: $E = mc^2$ and block:\n$$\\int_0^1 x dx$$';
			const ast: Root = [
				paragraph([
					plain('Formula: '),
					inlineKatex('E = mc^2'),
					plain(' and block:'),
				]),
				katex('\\int_0^1 x dx'),
			];

			expect(validateRoundtrip(ast, msg)).toBe(true);
		});

		it('handles RGBA color nodes', () => {
			const msg = 'Color is #ff007f';
			const ast: Root = [
				paragraph([
					plain('Color is '),
					color(255, 0, 127, 255),
				]),
			];

			const compact = compactify(ast, msg);
			expect(compact).toEqual([
				{
					t: 'p',
					c: [
						[0, 9],
						{ t: 'c', v: [255, 0, 127, 255] },
					],
				},
			]);
			expect(validateRoundtrip(ast, msg)).toBe(true);
		});

		it('handles timestamps with format and fallback', () => {
			const msg = 'Meeting at <t:1708551317:R>';
			const ast: Root = [
				paragraph([
					plain('Meeting at '),
					{
						type: 'TIMESTAMP',
						value: {
							timestamp: '1708551317',
							format: 'R',
						},
						fallback: [11, 26],
					},
				]),
			];

			expect(validateRoundtrip(ast, msg)).toBe(true);
		});
	});

	describe('Block Elements', () => {
		it('handles headings across all levels (1..4)', () => {
			const msg = '# Title 1\n## Title 2\n### Title 3\n#### Title 4';
			const ast: Root = [
				heading([plain('Title 1')], 1),
				heading([plain('Title 2')], 2),
				heading([plain('Title 3')], 3),
				heading([plain('Title 4')], 4),
			];

			expect(validateRoundtrip(ast, msg)).toBe(true);
			const compact = compactify(ast, msg);
			expect(compact).toEqual([
				{ t: 'h', l: 1, c: [[2, 9]] },
				{ t: 'h', l: 2, c: [[13, 20]] },
				{ t: 'h', l: 3, c: [[25, 32]] },
				{ t: 'h', l: 4, c: [[38, 45]] },
			]);
		});

		it('handles code blocks with and without language', () => {
			const msg = '```typescript\nconst a = 1;\nconst b = 2;\n```\n```\nplain text code\n```';
			const ast: Root = [
				code(
					[
						codeLine(plain('const a = 1;')),
						codeLine(plain('const b = 2;')),
					],
					'typescript'
				),
				code([codeLine(plain('plain text code'))], undefined as any),
			];

			expect(validateRoundtrip(ast, msg)).toBe(true);
		});

		it('handles quotes, blockquotes, and spoiler blocks', () => {
			const msg = '> A simple quote\n|||secret block|||';
			const ast: Root = [
				quote([paragraph([plain('A simple quote')])]),
				spoilerBlock([paragraph([plain('secret block')])]),
			];

			expect(validateRoundtrip(ast, msg)).toBe(true);
		});

		it('handles line breaks and horizontal rules', () => {
			const msg = 'First line\n---\nSecond line';
			const ast: Root = [
				paragraph([plain('First line')]),
				horizontalRule([11, 14]),
				lineBreak(),
				paragraph([plain('Second line')]),
			];

			expect(validateRoundtrip(ast, msg)).toBe(true);
		});
	});

	describe('Lists & Tasks', () => {
		it('handles ordered and unordered lists with numbering', () => {
			const msg = '1. First\n2. Second\n* Bullet 1\n* Bullet 2';
			const ast: Root = [
				orderedList([
					listItem([plain('First')], 1),
					listItem([plain('Second')], 2),
				]),
				unorderedList([
					listItem([plain('Bullet 1')]),
					listItem([plain('Bullet 2')]),
				]),
			];

			expect(validateRoundtrip(ast, msg)).toBe(true);
		});

		it('handles nested lists', () => {
			const msg = '1. Item 1\n   * Sub bullet\n2. Item 2';
			const ast: Root = [
				orderedList([
					listItem([plain('Item 1')], 1, [
						unorderedList([listItem([plain('Sub bullet')])]),
					]),
					listItem([plain('Item 2')], 2),
				]),
			];

			expect(validateRoundtrip(ast, msg)).toBe(true);
		});

		it('handles tasks with statuses and nested lists', () => {
			const msg = '[x] Completed task\n[ ] Incomplete task';
			const ast: Root = [
				tasks([
					task([plain('Completed task')], true),
					task([plain('Incomplete task')], false),
				]),
			];

			expect(validateRoundtrip(ast, msg)).toBe(true);
			const compact = compactify(ast, msg);
			const restored = expand(compact, msg);
			expect(restored).toEqual(ast);
		});
	});

	describe('Tables', () => {
		it('handles markdown tables with alignments and fallback span', () => {
			const msg = '| Name | Age |\n| :--- | :--: |\n| Alice | 30 |';
			const ast: Root = [
				table(
					[
						tableCell([plain('Name')], 'left'),
						tableCell([plain('Age')], 'center'),
					],
					[
						tableRow([
							tableCell([plain('Alice')], 'left'),
							tableCell([plain('30')], 'center'),
						]),
					],
					[0, 48]
				),
			];

			expect(validateRoundtrip(ast, msg)).toBe(true);
			const compact = compactify(ast, msg);
			const restored = expand(compact, msg);
			expect(restored).toEqual(ast);
		});
	});

	describe('Emojis & BigEmoji', () => {
		it('handles shortcode emoji, unicode emoji, and emoticons', () => {
			const msg = 'Hello :rocket: 😀 :-) world';
			const ast: Root = [
				paragraph([
					plain('Hello '),
					emoji(':rocket:'),
					plain(' '),
					emojiUnicode('😀'),
					plain(' '),
					emoticon(':-)', ':smile:'),
					plain(' world'),
				]),
			];

			expect(validateRoundtrip(ast, msg)).toBe(true);
		});

		it('handles BigEmoji standalone root', () => {
			const msg = ':rocket: :smile:';
			const ast: Root = [
				bigEmoji([
					emoji(':rocket:'),
					emoji(':smile:'),
				]),
			];

			const compact = compactify(ast, msg);
			expect(compact[0].t).toBe('E');
			expect(validateRoundtrip(ast, msg)).toBe(true);
		});
	});

	describe('Edge cases & Robustness', () => {
		it('handles duplicate words correctly using cursor progression', () => {
			const msg = 'the cat saw the cat and the cat smiled';
			const ast: Root = [
				paragraph([
					plain('the cat'),
					plain(' saw '),
					plain('the cat'),
					plain(' and '),
					plain('the cat'),
					plain(' smiled'),
				]),
			];

			const compact = compactify(ast, msg);
			expect(compact).toEqual([
				{
					t: 'p',
					c: [
						[0, 7],
						[7, 12],
						[12, 19],
						[19, 24],
						[24, 31],
						[31, 38],
					],
				},
			]);
			expect(validateRoundtrip(ast, msg)).toBe(true);
		});

		it('handles text that does not exist in message via string literal fallback', () => {
			const msg = 'Some original message';
			const ast: Root = [
				paragraph([
					plain('Text that is not in the message at all'),
				]),
			];

			const compact = compactify(ast, msg);
			expect(compact).toEqual([
				{
					t: 'p',
					c: ['Text that is not in the message at all'],
				},
			]);
			expect(validateRoundtrip(ast, msg)).toBe(true);
		});

		it('handles empty strings and empty paragraphs', () => {
			const msg = '';
			const ast: Root = [paragraph([plain('')])];

			expect(validateRoundtrip(ast, msg)).toBe(true);
		});
	});
});
