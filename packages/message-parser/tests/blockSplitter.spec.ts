import { BlockSplitter, BlockType } from '../src/BlockSplitter';

describe('BlockSplitter', () => {
    it('should split simple paragraphs', () => {
        const input = 'Hello\nWorld';
        const blocks = BlockSplitter.split(input);
        expect(blocks).toHaveLength(1);
        expect(blocks[0]).toEqual({
            type: BlockType.PARAGRAPH,
            content: 'Hello\nWorld',
        });
    });

    it('should identify headings', () => {
        const input = '# Heading 1\n## Heading 2\nContent';
        const blocks = BlockSplitter.split(input);
        expect(blocks).toHaveLength(3);
        expect(blocks[0]).toEqual({
            type: BlockType.HEADING,
            content: 'Heading 1',
            level: 1,
        });
        expect(blocks[1]).toEqual({
            type: BlockType.HEADING,
            content: 'Heading 2',
            level: 2,
        });
        expect(blocks[2]).toEqual({
            type: BlockType.PARAGRAPH,
            content: 'Content',
        });
    });

    it('should identify code blocks', () => {
        const input = 'Pre\n```javascript\nconst a = 1;\n```\nPost';
        const blocks = BlockSplitter.split(input);
        expect(blocks).toHaveLength(3);
        expect(blocks[0].type).toBe(BlockType.PARAGRAPH);
        expect(blocks[1]).toEqual({
            type: BlockType.CODE,
            content: 'const a = 1;',
            language: 'javascript',
        });
        expect(blocks[2].content).toBe('Post');
    });

    it('should identify blockquotes', () => {
        const input = '> Quote line 1\n> Quote line 2\nNormal text';
        const blocks = BlockSplitter.split(input);
        expect(blocks).toHaveLength(2);
        expect(blocks[0]).toEqual({
            type: BlockType.QUOTE,
            content: 'Quote line 1\nQuote line 2',
        });
        expect(blocks[1].type).toBe(BlockType.PARAGRAPH);
    });

    it('should handle mixed content correctly', () => {
        const input = '# Title\n\nSome text here.\n\n> A quote\n\n```\ncode\n```';
        const blocks = BlockSplitter.split(input);
        expect(blocks).toHaveLength(4);
        expect(blocks[0].type).toBe(BlockType.HEADING);
        expect(blocks[1].type).toBe(BlockType.PARAGRAPH);
        expect(blocks[2].type).toBe(BlockType.QUOTE);
        expect(blocks[3].type).toBe(BlockType.CODE);
    });
});
