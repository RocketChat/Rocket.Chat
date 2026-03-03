import type { Root } from './definitions';

export enum BlockType {
    PARAGRAPH = 'PARAGRAPH',
    HEADING = 'HEADING',
    CODE = 'CODE',
    LIST = 'LIST',
    QUOTE = 'QUOTE',
}

export type Block = {
    type: BlockType;
    content: string;
    level?: number;
    language?: string;
    ordered?: boolean;
};

export class BlockSplitter {
    public static split(input: string): Block[] {
        const lines = input.split(/\r?\n/);
        const blocks: Block[] = [];
        let currentBlock: Block | null = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // 1. Heading
            const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
            if (headingMatch) {
                this.flush(blocks, currentBlock);
                currentBlock = {
                    type: BlockType.HEADING,
                    content: headingMatch[2],
                    level: headingMatch[1].length,
                };
                this.flush(blocks, currentBlock);
                currentBlock = null;
                continue;
            }

            // 2. Code Block
            if (line.startsWith('```')) {
                this.flush(blocks, currentBlock);
                const language = line.slice(3).trim();
                let codeLines = [];
                i++;
                while (i < lines.length && !lines[i].startsWith('```')) {
                    codeLines.push(lines[i]);
                    i++;
                }
                blocks.push({
                    type: BlockType.CODE,
                    content: codeLines.join('\n'),
                    language,
                });
                currentBlock = null;
                continue;
            }

            // 3. Lists
            const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
            if (listMatch) {
                const isOrdered = /^\d+\./.test(listMatch[2]);
                if (currentBlock?.type !== BlockType.LIST || currentBlock.ordered !== isOrdered) {
                    this.flush(blocks, currentBlock);
                    currentBlock = {
                        type: BlockType.LIST,
                        content: listMatch[3],
                        ordered: isOrdered,
                    };
                } else {
                    currentBlock.content += '\n' + listMatch[3];
                }
                continue;
            }

            // 4. Blockquote
            if (line.startsWith('>')) {
                if (currentBlock?.type !== BlockType.QUOTE) {
                    this.flush(blocks, currentBlock);
                    currentBlock = {
                        type: BlockType.QUOTE,
                        content: line.slice(1).trim(),
                    };
                } else {
                    currentBlock.content += '\n' + line.slice(1).trim();
                }
                continue;
            }

            // 5. Paragraph (fallback)
            if (line.trim() === '') {
                this.flush(blocks, currentBlock);
                currentBlock = null;
                continue;
            }

            if (!currentBlock || currentBlock.type !== BlockType.PARAGRAPH) {
                this.flush(blocks, currentBlock);
                currentBlock = {
                    type: BlockType.PARAGRAPH,
                    content: line,
                };
            } else {
                currentBlock.content += '\n' + line;
            }
        }

        this.flush(blocks, currentBlock);
        return blocks;
    }

    private static flush(blocks: Block[], block: Block | null) {
        if (block) {
            blocks.push(block);
        }
    }
}
