import { GenericModal } from '@rocket.chat/ui-client';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useSidebarCategories } from './useSidebarCategories';

type DeleteCategoryModalProps = {
	categoryId: string;
	categoryName: string;
	onClose: () => void;
};

const DeleteCategoryModal = ({ categoryId, categoryName, onClose }: DeleteCategoryModalProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const { deleteCategory } = useSidebarCategories();

	const handleDelete = useCallback(() => {
		deleteCategory(categoryId);
		dispatchToastMessage({ type: 'success', message: t('Category_has_been_deleted', { name: categoryName }) });
		onClose();
	}, [deleteCategory, categoryId, dispatchToastMessage, t, categoryName, onClose]);

	return (
		<GenericModal
			variant='danger'
			title={t('Delete_category')}
			confirmText={t('Delete')}
			cancelText={t('Cancel')}
			onConfirm={handleDelete}
			onCancel={onClose}
			onClose={onClose}
		>
			{t('Delete_category_warning', { name: categoryName })}
		</GenericModal>
	);
};

export default DeleteCategoryModal;
