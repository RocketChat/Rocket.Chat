import type { ISidebarCategory } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import { useCategoryRoomIds } from './hooks/useCategoryRoomIds';
import { useDeleteCategory } from './hooks/useDeleteCategory';

type DeleteCategoryModalProps = {
	category: ISidebarCategory;
	onClose: () => void;
};

const DeleteCategoryModal = ({ category, onClose }: DeleteCategoryModalProps) => {
	const { t } = useTranslation();
	const deleteCategoryMutation = useDeleteCategory({ categoryName: category.name, settleCallback: onClose });
	const roomIds = useCategoryRoomIds(category._id);

	const handleConfirm = () => deleteCategoryMutation.mutateAsync({ categoryId: category._id, roomIds });

	return (
		<GenericModal
			variant='danger'
			title={t('Delete_category')}
			confirmText={t('Delete')}
			confirmLoading={deleteCategoryMutation.isPending}
			onConfirm={handleConfirm}
			onCancel={onClose}
		>
			<Box marginBlockEnd={16}>{t('Anything_you_added_to__name__will_move_back_to_default', { name: category.name })}</Box>
			<Box>{t('No_content_access_or_security_setting_will_be_lost_or_changed')}</Box>
		</GenericModal>
	);
};

export default DeleteCategoryModal;
