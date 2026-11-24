type Ids = { appId?: unknown; blockId?: unknown };

const elementKeys = ['elements', 'accessory', 'element', 'tabs', 'actions'] as const;

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

const withIds = (element: unknown, ids: Ids): unknown =>
	isObject(element) ? { appId: ids.appId ?? '', blockId: ids.blockId ?? '', actionId: '', ...element } : element;

const withCellIds = (cell: unknown, ids: Ids): unknown =>
	isObject(cell) && cell.type === 'action_cell' ? { ...cell, element: withIds(cell.element, ids) } : cell;

const withItemIds = (row: unknown): unknown => {
	if (!isObject(row) || !Array.isArray(row.items)) {
		return row;
	}

	return {
		...row,
		items: row.items.map((item) => {
			if (!isObject(item)) {
				return item;
			}

			return { ...item, block: (withElementIds([item.block]) as unknown[])[0] };
		}),
	};
};

/**
 * Copies blocks as the renderers see them: an element without `appId`, `blockId` or `actionId` takes its block's
 * ids, or an empty one, because apps leave them out and the engine or the renderer fills them in.
 */
export const withElementIds = (blocks: unknown): unknown => {
	if (!Array.isArray(blocks)) {
		return blocks;
	}

	return blocks.map((block) => {
		if (!isObject(block)) {
			return block;
		}

		const copy: Record<string, unknown> = { ...block };

		for (const key of elementKeys) {
			const value = copy[key];

			// The elements of a carousel are cards, which are blocks: they hand their own ids to their buttons.
			if (block.type === 'carousel' && key === 'elements') {
				copy[key] = withElementIds(value);
				continue;
			}

			copy[key] = Array.isArray(value) ? value.map((element) => withIds(element, block)) : withIds(value, block);
		}

		if (block.type === 'data_table' && Array.isArray(copy.rows)) {
			copy.rows = copy.rows.map((row) => (Array.isArray(row) ? row.map((cell) => withCellIds(cell, block)) : row));
		}

		if (block.type === 'container' && Array.isArray(copy.child_blocks)) {
			copy.child_blocks = withElementIds(copy.child_blocks);
		}

		if (block.type === 'layout') {
			if (Array.isArray(copy.rows)) {
				copy.rows = copy.rows.map(withItemIds);
			}

			if (Array.isArray(copy.fallback)) {
				copy.fallback = withElementIds(copy.fallback);
			}
		}

		if (Array.isArray(copy.render)) {
			copy.render = withElementIds(copy.render);
		}

		for (const key of elementKeys) {
			if (copy[key] === undefined) {
				delete copy[key];
			}
		}

		return copy;
	});
};
