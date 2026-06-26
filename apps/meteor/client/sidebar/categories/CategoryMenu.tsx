import { Box } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import DeleteCategoryModal from './DeleteCategoryModal';
import ManageCategoryChannelsModal from './ManageCategoryChannelsModal';

type CategoryMenuProps = {
	categoryId: string;
	categoryName: string;
};

const CategoryMenu = ({ categoryId, categoryName }: CategoryMenuProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();

	const items = useMemo<GenericMenuItemProps[]>(() => {
		const closeModal = (): void => setModal(null);
		return [
			{
				id: 'manage-channels',
				icon: 'cog',
				content: t('Manage_channels'),
				onClick: () => setModal(<ManageCategoryChannelsModal categoryId={categoryId} categoryName={categoryName} onClose={closeModal} />),
			},
			{
				id: 'delete-category',
				icon: 'trash',
				variant: 'danger',
				content: t('Delete_category'),
				onClick: () => setModal(<DeleteCategoryModal categoryId={categoryId} categoryName={categoryName} onClose={closeModal} />),
			},
		];
	}, [t, setModal, categoryId, categoryName]);

	// Stop clicks/keys from bubbling to the collapse-group header (which would toggle it).
	return (
		<Box onClick={(e): void => e.stopPropagation()} onKeyDown={(e): void => e.stopPropagation()}>
			<GenericMenu detached mini icon='kebab' title={t('Category_options')} items={items} />
		</Box>
	);
};

export default memo(CategoryMenu);
