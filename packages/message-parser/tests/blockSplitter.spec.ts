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
        // Per review: consecutive list lines remain in the same block
        // regardless of isOrdered change.
        expect(blocks.length).toBe(1);
        expect(blocks[0].type).toBe(BlockType.LIST);
        expect(blocks[0].ordered).toBe(false); // First item determines metadata
        expect(blocks[0].content).toBe('- item 1\n* item 2\n1. item 3');
    });

    it('should handle nested lists via indentation', () => {
        const input = '- Level 1\n  - Level 2\n    - Level 3';
        const blocks = BlockSplitter.split(input);
        expect(blocks.length).toBe(1);
        expect(blocks[0].content).toBe('- Level 1\n  - Level 2\n    - Level 3');
    });

    it('should correctly detect boundaries: list followed by heading', () => {
        const input = '- list item\n\n# Heading';
        const blocks = BlockSplitter.split(input);
        expect(blocks.length).toBe(2);
        expect(blocks[0].type).toBe(BlockType.LIST);
        expect(blocks[1].type).toBe(BlockType.HEADING);
    });

    it('should correctly detect boundaries: list followed by paragraph', () => {
        const input = '- list item\n\nNormal text';
        const blocks = BlockSplitter.split(input);
        expect(blocks.length).toBe(2);
        expect(blocks[0].type).toBe(BlockType.LIST);
        expect(blocks[1].type).toBe(BlockType.PARAGRAPH);
    });

    it('should not continue a list with a blank line even if indented', () => {
        const input = '- list item\n  \n# Next';
        const blocks = BlockSplitter.split(input);
        expect(blocks.length).toBe(2);
        expect(blocks[0].type).toBe(BlockType.LIST);
        expect(blocks[1].type).toBe(BlockType.HEADING);
    });

    it('should identify blockquotes and preserve content', () => {
        const input = '> quote line 1\n> quote line 2\nNormal text';
        const blocks = BlockSplitter.split(input);
        expect(blocks.length).toBe(2);
        expect(blocks[0].type).toBe(BlockType.QUOTE);
        expect(blocks[0].content).toBe('quote line 1\nquote line 2');
    });
});
