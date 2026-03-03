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

            const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
            const isIndentedAndNotBlank = /^\s+\S/.test(line);

            if (listMatch) {
                const isOrdered = /^\d+\./.test(listMatch[2]);
                // Per review: consecutive list lines remain in the same LIST block regardless of isOrdered changes
                if (currentBlock?.type !== BlockType.LIST) {
                    this.flush(blocks, currentBlock);
                    currentBlock = {
                        type: BlockType.LIST,
                        content: line,
                        ordered: isOrdered,
                    };
                } else {
                    currentBlock.content += '\n' + line;
                }
                continue;
            }

            if (isIndentedAndNotBlank && currentBlock?.type === BlockType.LIST) {
                currentBlock.content += '\n' + line;
                continue;
            }

            const quoteMatch = line.match(/^>\s*(.*)$/);
            if (quoteMatch) {
                if (currentBlock?.type !== BlockType.QUOTE) {
                    this.flush(blocks, currentBlock);
                    currentBlock = {
                        type: BlockType.QUOTE,
                        content: quoteMatch[1],
                    };
                } else {
                    currentBlock.content += '\n' + quoteMatch[1];
                }
                continue;
            }

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
