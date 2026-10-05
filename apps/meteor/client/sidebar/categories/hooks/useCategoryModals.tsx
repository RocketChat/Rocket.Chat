import type { ISidebarCategory } from '@rocket.chat/core-typings';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import type { MovableRoom } from './useUserSidebarCategories';
import { useUpsellActions } from '../../../components/GenericUpsellModal/hooks';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import CreateCategoryModal from '../CreateCategoryModal';
import CustomCategoryUpsellModal from '../CustomCategoryUpsellModal';
import DeleteCategoryModal from '../DeleteCategoryModal';
import ManageCategoryModal from '../ManageCategoryModal';

export const useCategoryModals = () => {
	const setModal = useSetModal();
	const { data: hasLicenseModule = false } = useHasLicenseModule('experimental-enterprise-features');
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
			openManage: (category: ISidebarCategory) => setModal(<ManageCategoryModal category={category} onClose={onClose} />),
			openDelete: (category: ISidebarCategory) => setModal(<DeleteCategoryModal category={category} onClose={onClose} />),
		};
	}, [handleManageSubscription, setModal, shouldShowUpsell]);
};
