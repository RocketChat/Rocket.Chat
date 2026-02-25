import { closeUnclosedCodeBlock } from '../../../lib/utils/closeUnclosedCodeBlock';

describe('closeUnclosedCodeBlock', () => {
	it('should return the text unchanged if there are no backticks', () => {
		expect(closeUnclosedCodeBlock('hello world')).toBe('hello world');
	});

	it('should return the text unchanged if code block is already closed', () => {
		const text = '```\ncode\n```';
		expect(closeUnclosedCodeBlock(text)).toBe(text);
	});

	it('should append closing backticks when code block is unclosed', () => {
		const text = '```\ncode';
		expect(closeUnclosedCodeBlock(text)).toBe('```\ncode\n```');
	});

	it('should handle code block with language specifier unclosed', () => {
		const text = '```javascript\nconst x = 1;';
		expect(closeUnclosedCodeBlock(text)).toBe('```javascript\nconst x = 1;\n```');
	});

	it('should return unchanged text when there are multiple closed code blocks', () => {
		const text = '```\ncode1\n```\ntext\n```\ncode2\n```';
		expect(closeUnclosedCodeBlock(text)).toBe(text);
	});

	it('should close unclosed block when there is one closed block followed by an unclosed block', () => {
		const text = '```\ncode1\n```\ntext\n```\ncode2';
		expect(closeUnclosedCodeBlock(text)).toBe('```\ncode1\n```\ntext\n```\ncode2\n```');
	});

	it('should return the text unchanged if it is empty', () => {
		expect(closeUnclosedCodeBlock('')).toBe('');
	});
});
