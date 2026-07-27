import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import CreateCategoryModal from './CreateCategoryModal';

const useCreateCategoryModal = () => {
	const { t } = useTranslation();
	const setModal = useSetModal();

	const createCategoryItem: GenericMenuItemProps = {
		id: 'category',
		content: t('Category'),
		icon: 'folder',
		onClick: () => {
			const closeModal = () => setModal(null);
			setModal(<CreateCategoryModal onClose={closeModal} />);
		},
	};

	return createCategoryItem;
};

export default useCreateCategoryModal;
