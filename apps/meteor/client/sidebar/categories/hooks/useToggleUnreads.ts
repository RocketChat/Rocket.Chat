import type { ISidebarCategory } from '@rocket.chat/core-typings';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { usePersistCategoriesMutation } from './usePersistCategoriesMutation';

export const useToggleUnreads = () => {
	const allEntries = useUserPreference<ISidebarCategory[]>('sidebarCategories', []) ?? [];

	const persistMutation = usePersistCategoriesMutation();

	const upsertGroupEntry = useCallback(
		(id: string, patch: Partial<ISidebarCategory>) => {
			const existing = allEntries.find((entry) => entry._id === id);
			const next = existing
				? allEntries.map((entry) => (entry._id === id ? { ...entry, ...patch } : entry))
				: [...allEntries, { _id: id, name: id, default: true, ...patch }];
			return persistMutation.mutateAsync(next);
		},
		[allEntries, persistMutation],
	);

	const isShowUnreads = useCallback((id: string) => allEntries.find((entry) => entry._id === id)?.showUnreads ?? false, [allEntries]);

	const isKeepUnreadsOnTop = useCallback(
		(id: string) => allEntries.find((entry) => entry._id === id)?.keepUnreadsOnTop ?? false,
		[allEntries],
	);

	const toggleShowUnreads = useCallback(
		(id: string) => upsertGroupEntry(id, { showUnreads: !isShowUnreads(id) }),
		[upsertGroupEntry, isShowUnreads],
	);

	const toggleKeepUnreadsOnTop = useCallback(
		(id: string) => upsertGroupEntry(id, { keepUnreadsOnTop: !isKeepUnreadsOnTop(id) }),
		[upsertGroupEntry, isKeepUnreadsOnTop],
	);

	return { toggleShowUnreads, toggleKeepUnreadsOnTop, isShowUnreads, isKeepUnreadsOnTop };
};
