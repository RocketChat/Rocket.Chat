import type { ISidebarCategory } from '@rocket.chat/core-typings';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useRef } from 'react';

import { usePersistCategoriesMutation } from './usePersistCategoriesMutation';
import { useUserSidebarCategories } from './useUserSidebarCategories';
import { withDynamicFirst } from '../../hooks/useCategoryList';
import { useSidebarSectionsOrder } from '../../hooks/useSidebarSectionsOrder';

// Each write replaces the whole `sidebarCategories` array. Two quick changes (filtering two groups, or a filter
// and an unread toggle) would both start from the same snapshot, and the second would drop the first. So writes
// run one at a time, each starting from what the previous one wrote until the preference catches up.
let writeQueue: Promise<void> = Promise.resolve();
let pendingWrites = 0;
let lastWritten: ISidebarCategory[] | undefined;

const applyPatch = (
	categories: ISidebarCategory[],
	sidebarSectionsOrder: readonly string[],
	id: string,
	patch: Partial<ISidebarCategory>,
): ISidebarCategory[] => {
	if (categories.some((entry) => entry._id === id)) {
		return categories.map((entry) => (entry._id === id ? { ...entry, ...patch } : entry));
	}

	const entryMap = new Map(categories.map((entry) => [entry._id, entry]));
	entryMap.set(id, { _id: id, name: id, default: true, ...patch });

	const merged = withDynamicFirst(
		categories.map((entry) => entry._id),
		sidebarSectionsOrder,
	);

	return merged.map((key) => entryMap.get(key) ?? { _id: key, name: key, default: true });
};

/** Persists display metadata for a group, creating its `sidebarCategories` entry when it has none yet. */
export const useUpsertGroupEntry = () => {
	const { rawCategories } = useUserSidebarCategories();
	const sidebarSectionsOrder = useSidebarSectionsOrder();
	const { mutateAsync: persistCategories } = usePersistCategoriesMutation();
	const dispatchToastMessage = useToastMessageDispatch();

	const rawCategoriesRef = useRef(rawCategories);
	rawCategoriesRef.current = rawCategories;

	// The preference now reflects every write made so far.
	useEffect(() => {
		if (!pendingWrites) {
			lastWritten = undefined;
		}
	}, [rawCategories]);

	return useCallback(
		async (id: string, patch: Partial<ISidebarCategory>) => {
			pendingWrites++;
			const write = writeQueue.then(async () => {
				const next = applyPatch(lastWritten ?? rawCategoriesRef.current, sidebarSectionsOrder, id, patch);
				await persistCategories(next);
				lastWritten = next;
			});
			writeQueue = write.catch(() => undefined);

			try {
				await write;
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				pendingWrites--;
			}
		},
		[sidebarSectionsOrder, persistCategories, dispatchToastMessage],
	);
};
