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
	incomplete?: boolean;
};

export class BlockSplitter {
	public static split(input: string): Block[] {
		const lines = input.split(/\r?\n/);
		const blocks: Block[] = [];
		let currentBlock: Block | null = null;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];

			// Check for heading: # ## ### ####
			const headingResult = this.parseHeading(line);
			if (headingResult) {
				this.flush(blocks, currentBlock);
				currentBlock = {
					type: BlockType.HEADING,
					content: headingResult.content,
					level: headingResult.level,
				};
				this.flush(blocks, currentBlock);
				currentBlock = null;
				continue;
			}

			if (line.startsWith('```')) {
				this.flush(blocks, currentBlock);
				const language = line.slice(3).trim();
				const codeLines = [];
				let closed = false;
				i++;
				while (i < lines.length && !lines[i].startsWith('```')) {
					codeLines.push(lines[i]);
					i++;
				}
				if (i < lines.length) {
					closed = true;
				}
				blocks.push({
					type: BlockType.CODE,
					content: codeLines.join('\n'),
					language,
					incomplete: !closed,
				});
				currentBlock = null;
				continue;
			}

			// Check for blank line - don't flush lists if the blank line has leading spaces
			const isBlank = line.trim() === '';
			if (isBlank) {
				const hasLeadingSpaces = line.length > 0 && line.charCodeAt(0) === 32; // ' '
				if (!(hasLeadingSpaces && currentBlock?.type === BlockType.LIST)) {
					this.flush(blocks, currentBlock);
					currentBlock = null;
				}
				continue;
			}

			// Check for list item
			const listResult = this.parseListItem(line);
			const isIndented = line.length > 0 && line.charCodeAt(0) === 32;

			if (listResult) {
				if (currentBlock?.type !== BlockType.LIST) {
					this.flush(blocks, currentBlock);
					currentBlock = {
						type: BlockType.LIST,
						content: line,
						ordered: listResult.isOrdered,
					};
				} else {
					if (currentBlock.ordered !== undefined && currentBlock.ordered !== listResult.isOrdered) {
						currentBlock.ordered = undefined;
					}
					currentBlock.content += `\n${line}`;
				}
				continue;
			}

			if (isIndented && currentBlock?.type === BlockType.LIST) {
				currentBlock.content += `\n${line}`;
				continue;
			}

			if (line.startsWith('>')) {
				if (currentBlock?.type !== BlockType.QUOTE) {
					this.flush(blocks, currentBlock);
					currentBlock = {
						type: BlockType.QUOTE,
						content: line,
					};
				} else {
					currentBlock.content += `\n${line}`;
				}
				continue;
			}

			if (currentBlock?.type !== BlockType.PARAGRAPH) {
				this.flush(blocks, currentBlock);
				currentBlock = {
					type: BlockType.PARAGRAPH,
					content: line,
				};
			} else {
				currentBlock.content += `\n${line}`;
			}
		}

		this.flush(blocks, currentBlock);
		return blocks;
	}

	private static parseHeading(line: string): { level: number; content: string } | null {
		let level = 0;
		let pos = 0;

		// Count leading '#' characters (max 6 for heading)
		while (pos < line.length && line.charCodeAt(pos) === 35 /* '#' */ && level < 6) {
			level++;
			pos++;
		}

		if (level === 0) {
			return null;
		}

		// Must have at least one space after '#'
		if (pos >= line.length || line.charCodeAt(pos) !== 32 /* ' ' */) {
			return null;
		}

		// Skip the space and get content
		pos++;
		const content = line.slice(pos);

		// Content must not be empty
		if (content.length === 0) {
			return null;
		}

		return { level, content };
	}

	private static parseListItem(line: string): { isOrdered: boolean } | null {
		let pos = 0;

		// Skip leading spaces
		while (pos < line.length && line.charCodeAt(pos) === 32 /* ' ' */) {
			pos++;
		}

		const start = pos;

		// Check for ordered list (digits followed by '.')
		if (pos < line.length && line.charCodeAt(pos) >= 48 && line.charCodeAt(pos) <= 57 /* 0-9 */) {
			while (pos < line.length && line.charCodeAt(pos) >= 48 && line.charCodeAt(pos) <= 57) {
				pos++;
			}
			if (pos < line.length && line.charCodeAt(pos) === 46 /* '.' */) {
				pos++;
				// Must have space after '.'
				if (pos < line.length && line.charCodeAt(pos) === 32 /* ' ' */) {
					pos++;
					// Must have content after space
					if (pos < line.length) {
						return { isOrdered: true };
					}
				}
			}
			// Reset if ordered list pattern didn't match
			pos = start;
		}

		// Check for unordered list (-, *, or +)
		const char = line.charCodeAt(pos);
		if (char === 45 /* '-' */ || char === 42 /* '*' */ || char === 43 /* '+' */) {
			pos++;
			// Must have space after marker
			if (pos < line.length && line.charCodeAt(pos) === 32 /* ' ' */) {
				pos++;
				// Must have content after space
				if (pos < line.length) {
					return { isOrdered: false };
				}
			}
		}

		return null;
	}

	private static flush(blocks: Block[], block: Block | null) {
		if (block) {
			blocks.push(block);
		}
	}
}
