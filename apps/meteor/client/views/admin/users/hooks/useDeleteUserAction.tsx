import type { IUser } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import {
	useSetModal,
	useToastMessageDispatch,
	useRoute,
	useSetting,
	usePermission,
	useEndpoint,
	useTranslation,
} from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import type { AdminUserAction } from './useAdminUserInfoActions';
import { useConfirmOwnerChanges } from './useConfirmOwnerChanges';
import GenericModal from '../../../../components/GenericModal';

export const useDeleteUserAction = (userId: IUser['_id'], onChange: () => void, onReload: () => void): AdminUserAction | undefined => {
	const t = useTranslation();
	const setModal = useSetModal();
	const userRoute = useRoute('admin-users');
	const canDeleteUser = usePermission('delete-user');
	const erasureType = useSetting('Message_ErasureType');
	const confirmOwnerChanges = useConfirmOwnerChanges();
	const dispatchToastMessage = useToastMessageDispatch();

	const handleDeletedUser = (): void => {
		setModal();
		userRoute.push({});
		onReload();
	};

	const deleteUserQuery = useMemo(() => ({ userId, confirmRelinquish: false }), [userId]);
	const deleteUserEndpoint = useEndpoint('POST', '/v1/users.delete');

	const deleteUser = (): Promise<void> =>
		confirmOwnerChanges(
			async (confirm = false) => {
				if (confirm) {
					deleteUserQuery.confirmRelinquish = confirm;
				}

				try {
					await deleteUserEndpoint(deleteUserQuery);
					dispatchToastMessage({ type: 'success', message: t('User_has_been_deleted') });
					handleDeletedUser();
				} catch (error) {
					throw error;
				}
			},
			{
				contentTitle: t(`Delete_User_Warning_${erasureType}` as TranslationKey),
				confirmText: t('Delete'),
			},
			onChange,
		);

	const confirmDeleteUser = useEffectEvent(() => {
		setModal(
			<GenericModal variant='danger' onConfirm={deleteUser} onCancel={(): void => setModal()} confirmText={t('Delete')}>
				{t(`Delete_User_Warning_${erasureType}` as TranslationKey)}
			</GenericModal>,
		);
	});

	return canDeleteUser
		? {
				icon: 'trash',
				content: t('Delete'),
				onClick: confirmDeleteUser,
				variant: 'danger',
			}
		: undefined;
};
