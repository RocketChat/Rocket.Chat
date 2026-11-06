import { useCallback } from 'react';

import { useUpsertGroupEntry } from './useUpsertGroupEntry';
import { useUserSidebarCategories } from './useUserSidebarCategories';

export const useToggleUnreads = () => {
	const { rawCategories } = useUserSidebarCategories();
	const upsertGroupEntry = useUpsertGroupEntry();

	const isShowUnreads = useCallback((id: string) => rawCategories.find((entry) => entry._id === id)?.showUnreads ?? false, [rawCategories]);

	const isKeepUnreadsOnTop = useCallback(
		(id: string) => rawCategories.find((entry) => entry._id === id)?.keepUnreadsOnTop ?? false,
		[rawCategories],
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
