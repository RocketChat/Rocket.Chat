import type { ISidebarCustomCategory } from '@rocket.chat/core-typings';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import CreateCategoryModal from './CreateCategoryModal';
import DeleteCategoryModal from './DeleteCategoryModal';
import ManageCategoryModal from './ManageCategoryModal';
import type { MovableRoom } from '../hooks/useCustomCategories';

export const useCategoryModals = () => {
	const setModal = useSetModal();

	return useMemo(() => {
		const onClose = () => setModal(null);

		return {
			openCreate: (room?: MovableRoom) => setModal(<CreateCategoryModal room={room} onClose={onClose} />),
			openManage: (category: ISidebarCustomCategory) => setModal(<ManageCategoryModal category={category} onClose={onClose} />),
			openDelete: (category: ISidebarCustomCategory) => setModal(<DeleteCategoryModal category={category} onClose={onClose} />),
		};
	}, [setModal]);
};
