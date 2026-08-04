import { BlockSplitter, BlockType } from '../src/BlockSplitter';

describe('BlockSplitter', () => {
	it('should split simple paragraphs', () => {
		const input = 'Hello\nWorld';
		const blocks = BlockSplitter.split(input);
		expect(blocks.length).toBe(1);
		expect(blocks[0].type).toBe(BlockType.PARAGRAPH);
		expect(blocks[0].content).toBe('Hello\nWorld');
	});

	it('should identify headings', () => {
		const input = '# Heading 1\n## Heading 2\nContent';
		const blocks = BlockSplitter.split(input);
		expect(blocks.length).toBe(3);
		expect(blocks[0].type).toBe(BlockType.HEADING);
		expect(blocks[0].level).toBe(1);
		expect(blocks[1].type).toBe(BlockType.HEADING);
		expect(blocks[1].level).toBe(2);
	});

	it('should identify code blocks', () => {
		const input = 'Pre\n```javascript\nconst a = 1;\n```\nPost';
		const blocks = BlockSplitter.split(input);
		expect(blocks.length).toBe(3);
		expect(blocks[1].type).toBe(BlockType.CODE);
		expect(blocks[1].language).toBe('javascript');
		expect(blocks[1].content).toBe('const a = 1;');
	});

	it('should handle list splitting and preserve full syntax', () => {
		const input = '- item 1\n* item 2\n1. item 3';
		const blocks = BlockSplitter.split(input);
		expect(blocks.length).toBe(1);
		expect(blocks[0].type).toBe(BlockType.LIST);
		expect(blocks[0].content).toBe('- item 1\n* item 2\n1. item 3');
	});

	it('should handle nested lists via indentation', () => {
		const input = '- Level 1\n  - Level 2\n    - Level 3';
		const blocks = BlockSplitter.split(input);
		expect(blocks.length).toBe(1);
		expect(blocks[0].content).toBe('- Level 1\n  - Level 2\n    - Level 3');
	});

	it('should allow indented blank lines to continue a list', () => {
		const input = '- item 1\n  \n- item 2';
		const blocks = BlockSplitter.split(input);
		expect(blocks.length).toBe(1);
		expect(blocks[0].content).toBe('- item 1\n  \n- item 2');
	});

	it('should correctly detect boundaries: list followed by heading', () => {
		const input = '- list item\n\n# Heading';
		const blocks = BlockSplitter.split(input);
		expect(blocks.length).toBe(2);
		expect(blocks[0].type).toBe(BlockType.LIST);
		expect(blocks[1].type).toBe(BlockType.HEADING);
	});

	it('should identify blockquotes and preserve markers', () => {
		const input = '> quote line 1\n> quote line 2';
		const blocks = BlockSplitter.split(input);
		expect(blocks.length).toBe(1);
		expect(blocks[0].type).toBe(BlockType.QUOTE);
		expect(blocks[0].content).toBe('> quote line 1\n> quote line 2');
	});

	it('should support nested blockquotes', () => {
		const input = '> outer\n>> inner';
		const blocks = BlockSplitter.split(input);
		expect(blocks.length).toBe(1);
		expect(blocks[0].type).toBe(BlockType.QUOTE);
		expect(blocks[0].content).toBe('> outer\n>> inner');
	});

	it('should set ordered to undefined for mixed ordered and unordered list items', () => {
		const input = '- unordered\n1. ordered';
		const blocks = BlockSplitter.split(input);
		expect(blocks.length).toBe(1);
		expect(blocks[0].type).toBe(BlockType.LIST);
		expect(blocks[0].ordered).toBeUndefined();
	});

	it('should keep ordered=true for fully ordered lists', () => {
		const input = '1. first\n2. second';
		const blocks = BlockSplitter.split(input);
		expect(blocks.length).toBe(1);
		expect(blocks[0].type).toBe(BlockType.LIST);
		expect(blocks[0].ordered).toBe(true);
	});

	it('should keep ordered=false for fully unordered lists', () => {
		const input = '- first\n* second';
		const blocks = BlockSplitter.split(input);
		expect(blocks.length).toBe(1);
		expect(blocks[0].type).toBe(BlockType.LIST);
		expect(blocks[0].ordered).toBe(false);
	});

	it('should create a new paragraph block after a list block', () => {
		const input = '- list item\n\nParagraph text';
		const blocks = BlockSplitter.split(input);
		expect(blocks.length).toBe(2);
		expect(blocks[0].type).toBe(BlockType.LIST);
		expect(blocks[1].type).toBe(BlockType.PARAGRAPH);
		expect(blocks[1].content).toBe('Paragraph text');
	});

	it('should create a new paragraph block after a quote block', () => {
		const input = '> blockquote\n\nParagraph text';
		const blocks = BlockSplitter.split(input);
		expect(blocks.length).toBe(2);
		expect(blocks[0].type).toBe(BlockType.QUOTE);
		expect(blocks[1].type).toBe(BlockType.PARAGRAPH);
		expect(blocks[1].content).toBe('Paragraph text');
	});

	it('should handle empty input correctly', () => {
		const input = '';
		const blocks = BlockSplitter.split(input);
		expect(blocks.length).toBe(0);
	});

	it('should yield a CODE block with incomplete flag for an unclosed code fence', () => {
		const input = '```js\ncode';
		const blocks = BlockSplitter.split(input);
		expect(blocks.length).toBe(1);
		expect(blocks[0].type).toBe(BlockType.CODE);
		expect(blocks[0].content).toBe('code');
		expect(blocks[0].incomplete).toBe(true);
	});

	it('should treat a heading without a space as a paragraph', () => {
		const input = '#NoSpace';
		const blocks = BlockSplitter.split(input);
		expect(blocks.length).toBe(1);
		expect(blocks[0].type).toBe(BlockType.PARAGRAPH);
		expect(blocks[0].content).toBe('#NoSpace');
	});
});
