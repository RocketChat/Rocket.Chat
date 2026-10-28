import { Messages } from '@rocket.chat/models';

import { SystemLogger } from '../lib/logger/system';

const { USE_ROOM_SEARCH_INDEX = 'false' } = process.env;

// MongoDB stores a text index's key with `_fts: 'text'` / `_ftsx: 1` placeholders
// and tracks the original text fields in `weights`. Classify by looking at the
// non-placeholder prefix fields plus weights.
const classifyTextIndex = (idx: { key: Record<string, unknown>; weights?: Record<string, number> }) => {
	const { weights, key } = idx;
	if (weights?.msg !== 1 || Object.keys(weights).length !== 1) {
		return 'other';
	}

	const prefix = Object.keys(key).filter((k) => k !== '_fts' && k !== '_ftsx');
	if (prefix.length === 0) {
		return 'default';
	}

	if (prefix.length === 1 && prefix[0] === 'rid' && key.rid === 1) {
		return 'room-scoped';
	}

	return 'other';
};

export const ensureMessagesTextIndex = async (): Promise<void> => {
	const desiredShape = USE_ROOM_SEARCH_INDEX === 'true' ? 'room-scoped' : 'default';

	SystemLogger.debug({
		msg: 'checking messages text index',
		USE_ROOM_SEARCH_INDEX,
		desired: desiredShape,
	});

	let existing;
	try {
		existing = await Messages.col.indexes();
	} catch (err) {
		SystemLogger.error({ msg: 'failed to list messages indexes; skipping text index check', err });
		return;
	}

	const textIndexes = existing.filter((idx) => Object.values(idx.key).includes('text'));
	const matching = textIndexes.find((idx) => classifyTextIndex(idx) === desiredShape);
	const stale = textIndexes.filter((idx) => idx !== matching);

	if (matching && stale.length === 0) {
		SystemLogger.debug({ msg: 'messages text index already matches desired shape', name: matching.name });
		return;
	}

	for (const idx of stale) {
		if (!idx.name) {
			continue;
		}
		SystemLogger.startup({
			msg: 'dropping messages text index; may take several minutes on large databases',
			name: idx.name,
			shape: classifyTextIndex(idx),
		});
		try {
			await Messages.col.dropIndex(idx.name);
			SystemLogger.startup({ msg: 'dropped messages text index', name: idx.name });
		} catch (err) {
			SystemLogger.error({ msg: 'failed to drop messages text index; aborting', name: idx.name, err });
			return;
		}
	}

	if (matching) {
		SystemLogger.debug({ msg: 'messages text index already matches desired shape', name: matching.name });
		return;
	}

	SystemLogger.startup({
		msg: 'creating messages text index; may take several minutes on large databases',
		shape: desiredShape,
	});
	try {
		const name = await Messages.col.createIndex(desiredShape === 'room-scoped' ? { rid: 1, msg: 'text' } : { msg: 'text' });
		SystemLogger.startup({ msg: 'created messages text index', name, shape: desiredShape });
	} catch (err) {
		SystemLogger.error({ msg: 'failed to create messages text index', shape: desiredShape, err });
	}
};
