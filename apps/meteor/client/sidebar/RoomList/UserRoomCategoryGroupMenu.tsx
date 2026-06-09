import { SidebarV2ItemMenu } from '@rocket.chat/fuselage';
import { GenericMenu, GenericModal } from '@rocket.chat/ui-client';
import { useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import RenameUserRoomCategoryModal from './RenameUserRoomCategoryModal';
import { useUserRoomCategories } from '../../hooks/useUserRoomCategories';

type UserRoomCategoryGroupMenuProps = {
	categoryName: string;
};

const UserRoomCategoryGroupMenu = ({ categoryName }: UserRoomCategoryGroupMenuProps) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const { removeCategory } = useUserRoomCategories();

	const openConfirmDelete = useCallback(() => {
		const onConfirm = async () => {
			try {
				await removeCategory(categoryName);
				dispatchToastMessage({ type: 'success', message: t('User_room_category_deleted') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error ?? t('Something_went_wrong') });
			} finally {
				setModal(null);
			}
		};

		setModal(
			<GenericModal
				variant='danger'
				title={t('User_room_category_delete')}
				onCancel={() => setModal(null)}
				onConfirm={onConfirm}
				confirmText={t('Delete')}
			>
				{t('User_room_category_delete_confirm', { name: categoryName })}
			</GenericModal>,
		);
	}, [categoryName, dispatchToastMessage, removeCategory, setModal, t]);

	const openRename = useCallback(() => {
		setModal(<RenameUserRoomCategoryModal oldName={categoryName} onClose={() => setModal(null)} />);
	}, [categoryName, setModal]);

	return (
		<SidebarV2ItemMenu>
			<GenericMenu
				detached
				mini
				title={t('Options')}
				sections={[
					{
						items: [
							{
								id: 'rename-user-room-category',
								content: t('User_room_category_rename'),
								icon: 'edit',
								onClick: openRename,
							},
							{
								id: 'delete-user-room-category',
								content: t('User_room_category_delete'),
								icon: 'trash',
								variant: 'danger',
								onClick: openConfirmDelete,
							},
						],
					},
				]}
			/>
		</SidebarV2ItemMenu>
	);
};

export default UserRoomCategoryGroupMenu;
