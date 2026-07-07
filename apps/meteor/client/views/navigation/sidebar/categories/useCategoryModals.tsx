import type { ISidebarCustomCategory } from '@rocket.chat/core-typings';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import CategoryFormModal from './CategoryFormModal';
import DeleteCategoryModal from './DeleteCategoryModal';
import RenameCategoryModal from './RenameCategoryModal';
import type { MovableRoom } from '../../hooks/useCustomCategories';

/** Centralizes opening the category modals so menus, the create (+) menu and the room header share one entry point. */
export const useCategoryModals = () => {
	const setModal = useSetModal();

	return useMemo(() => {
		const onClose = () => setModal(null);

		return {
			/** Flow B (no room) / flow D (with room => create and move). */
			openCreate: (room?: MovableRoom) => setModal(<CategoryFormModal room={room} onClose={onClose} />),
			openRename: (category: ISidebarCustomCategory) => setModal(<RenameCategoryModal category={category} onClose={onClose} />),
			openDelete: (category: ISidebarCustomCategory) => setModal(<DeleteCategoryModal category={category} onClose={onClose} />),
		};
	}, [setModal]);
};
