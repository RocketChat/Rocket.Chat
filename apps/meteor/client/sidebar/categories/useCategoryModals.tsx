import type { ISidebarCustomCategory } from '@rocket.chat/core-typings';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import CreateCategoryModal from './CreateCategoryModal';
import CustomCategoryUpsellModal from './CustomCategoryUpsellModal';
import DeleteCategoryModal from './DeleteCategoryModal';
import ManageCategoryModal from './ManageCategoryModal';
import { useUpsellActions } from '../../components/GenericUpsellModal/hooks';
import { useCustomCategories } from '../hooks/useCustomCategories';
import type { MovableRoom } from '../hooks/useCustomCategories';

export const useCategoryModals = () => {
	const setModal = useSetModal();
	const { hasLicenseModule } = useCustomCategories();
	const { shouldShowUpsell, handleManageSubscription } = useUpsellActions(hasLicenseModule);

	return useMemo(() => {
		const onClose = () => setModal(null);

		if (shouldShowUpsell) {
			const handleOpenUpsellModal = () => setModal(<CustomCategoryUpsellModal onClose={onClose} onConfirm={handleManageSubscription} />);

			return {
				openCreate: handleOpenUpsellModal,
				openManage: handleOpenUpsellModal,
				openDelete: handleOpenUpsellModal,
			};
		}

		return {
			openCreate: (room?: MovableRoom) => setModal(<CreateCategoryModal room={room} onClose={onClose} />),
			openManage: (category: ISidebarCustomCategory) => setModal(<ManageCategoryModal category={category} onClose={onClose} />),
			openDelete: (category: ISidebarCustomCategory) => setModal(<DeleteCategoryModal category={category} onClose={onClose} />),
		};
	}, [handleManageSubscription, setModal, shouldShowUpsell]);
};
