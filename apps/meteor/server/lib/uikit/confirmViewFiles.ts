import { Uploads } from '@rocket.chat/models';
import { flattenBlocks } from '@rocket.chat/ui-kit';

const DEFAULT_MAX_FILES = 10;

type ViewLike = { blocks?: unknown; state?: unknown };

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

const getFileInputIds = ({ blocks, state }: ViewLike): string[] => {
	if (!Array.isArray(blocks) || !isObject(state)) {
		return [];
	}

	const ids = new Set<string>();

	for (const { block, blockId: holderBlockId } of flattenBlocks(blocks)) {
		if (block.type !== 'input' || !isObject(block.element) || block.element.type !== 'file_input') {
			continue;
		}

		const { actionId, blockId = holderBlockId, max_files: maxFiles } = block.element;
		const blockState = typeof blockId === 'string' ? state[blockId] : undefined;
		const value = isObject(blockState) && typeof actionId === 'string' ? blockState[actionId] : undefined;

		if (!Array.isArray(value)) {
			continue;
		}

		const limit = typeof maxFiles === 'number' && maxFiles > 0 ? maxFiles : DEFAULT_MAX_FILES;
		value
			.filter((id): id is string => typeof id === 'string')
			.slice(0, limit)
			.forEach((id) => ids.add(id));
	}

	return [...ids];
};

/** Keeps the files a user attached to a submitted view from expiring; files of other users are left alone. */
export const confirmViewFiles = async (view: ViewLike, userId: string | undefined): Promise<void> => {
	if (!userId) {
		return;
	}

	await Promise.all(getFileInputIds(view).map((fileId) => Uploads.confirmTemporaryFile(fileId, userId)));
};
