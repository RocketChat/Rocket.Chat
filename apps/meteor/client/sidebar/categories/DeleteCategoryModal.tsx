import type { ISidebarCategory } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useCustomCategories } from '../hooks/useCustomCategories';

type DeleteCategoryModalProps = {
	category: ISidebarCategory;
	onClose: () => void;
};

const DeleteCategoryModal = ({ category, onClose }: DeleteCategoryModalProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const { deleteCategory, isPersisting } = useCustomCategories();

	const handleConfirm = async () => {
		try {
			await deleteCategory(category._id);
			dispatchToastMessage({ type: 'success', message: t('Category__name__deleted', { name: category.name }) });
			onClose();
		} catch (e) {
			dispatchToastMessage({ type: 'error', message: e });
		}
	};

	return (
		<GenericModal
			variant='danger'
			title={t('Delete_category')}
			confirmText={t('Delete')}
			confirmLoading={isPersisting}
			confirmDisabled={isPersisting}
			onConfirm={handleConfirm}
			onCancel={onClose}
		>
			<Box marginBlockEnd={16}>{t('Anything_you_added_to__name__will_move_back_to_default', { name: category.name })}</Box>
			<Box>{t('No_content_access_or_security_setting_will_be_lost_or_changed')}</Box>
		</GenericModal>
	);
};

export default DeleteCategoryModal;
