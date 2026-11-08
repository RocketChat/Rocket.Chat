import { conditionsMatch } from '../rendering/resolveConditionalBlocks';

type Node = Record<string, unknown>;

const isNode = (value: unknown): value is Node => typeof value === 'object' && value !== null && !Array.isArray(value);

/** The blocks a container, layout or conditional block holds; payloads are unchecked, so anything may be in them. */
export const nestedBlocks = (block: Node): unknown[] => {
	if (block.type === 'conditional') {
		return Array.isArray(block.render) ? block.render : [];
	}

	if (block.type === 'container') {
		return Array.isArray(block.child_blocks) ? block.child_blocks : [];
	}

	if (block.type !== 'layout' || !Array.isArray(block.rows)) {
		return [];
	}

	return block.rows.flatMap((row) =>
		isNode(row) && Array.isArray(row.items) ? row.items.map((item) => (isNode(item) ? item.block : undefined)) : [],
	);
};

/**
 * Every block in the list and nested in them that the web client draws, each with the blockId the client stores its
 * elements under: its own, or that of the nearest container or layout holding it that has one, since apps leave the id
 * off nested blocks. A conditional block hands down no id and only its web branch is walked, as the renderer does.
 */
export const flattenBlocks = <Block extends object = Node>(
	blocks: readonly unknown[],
	inheritedBlockId?: string,
): { block: Block; blockId: string | undefined }[] =>
	blocks.filter(isNode).flatMap((block) => {
		const isConditional = block.type === 'conditional';
		const blockId = typeof block.blockId === 'string' && !isConditional ? block.blockId : inheritedBlockId;
		const children = isConditional && !conditionsMatch({ engine: 'rocket.chat' }, block.when as never) ? [] : nestedBlocks(block);

		// The payload is only known to be an object here; callers narrow what they read from it.
		return [{ block: block as Block, blockId }, ...flattenBlocks<Block>(children, blockId)];
	});
