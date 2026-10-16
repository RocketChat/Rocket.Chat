type Ids = { appId?: unknown; blockId?: unknown };

const elementKeys = ['elements', 'accessory', 'element', 'tabs'] as const;

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

const withIds = (element: unknown, ids: Ids): unknown =>
	isObject(element) ? { appId: ids.appId ?? '', blockId: ids.blockId ?? '', actionId: '', ...element } : element;

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
			copy[key] = Array.isArray(value) ? value.map((element) => withIds(element, block)) : withIds(value, block);
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
