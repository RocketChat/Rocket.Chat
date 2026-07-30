import type { ISidebarCustomCategory } from '@rocket.chat/core-typings';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import CategoryFormModal from './CategoryFormModal';
import DeleteCategoryModal from './DeleteCategoryModal';
import RenameCategoryModal from './RenameCategoryModal';
import type { MovableRoom } from '../hooks/useCustomCategories';

export const useCategoryModals = () => {
	const setModal = useSetModal();

	return useMemo(() => {
		const onClose = () => setModal(null);

		return {
			openCreate: (room?: MovableRoom) => setModal(<CategoryFormModal room={room} onClose={onClose} />),
			openRename: (category: ISidebarCustomCategory) => setModal(<RenameCategoryModal category={category} onClose={onClose} />),
			openDelete: (category: ISidebarCustomCategory) => setModal(<DeleteCategoryModal category={category} onClose={onClose} />),
		};
	}, [setModal]);
};
