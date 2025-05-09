import type { IUser } from '@rocket.chat/core-typings';
import type { IconProps } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { usePermission, useRoute } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { AdminUsersTab } from '../AdminUsersPage';
import { useChangeAdminStatusAction } from './useChangeAdminStatusAction';
import { useChangeUserStatusAction } from './useChangeUserStatusAction';
import { useDeleteUserAction } from './useDeleteUserAction';
import { useResetE2EEKeyAction } from './useResetE2EEKeyAction';
import { useResetTOTPAction } from './useResetTOTPAction';

export type AdminUserAction = {
	type?: string;
	content: string;
	icon?: IconProps['name'];
	title?: string;
	variant?: 'danger';
	onClick: () => void;
};

type AdminUserMenuAction = {
	id: string;
	title: string;
	items: GenericMenuItemProps[];
}[];

export type AdminUserInfoActionsProps = {
	username: IUser['username'];
	userId: IUser['_id'];
	isFederatedUser: IUser['federated'];
	isActive: boolean;
	isAdmin: boolean;
	tab: AdminUsersTab;
	onChange: () => void;
	onReload: () => void;
};

const useAdminUserInfoActionsSpread = (actions: Record<string, AdminUserAction>, size = 2) => {
	const actionSpread = useMemo(() => {
		const entries = Object.entries(actions);

		const options = entries.slice(0, size);
		const slicedOptions = entries.slice(size, entries.length);

		const menuActions = slicedOptions.reduce((acc, [_key, item]) => {
			const group = item.type ? item.type : '';
			const section = acc.find((section: { id: string }) => section.id === group);

			const newItem = {
				...item,
				id: item.content || item.title || '',
				content: item.content || item.title,
			};

			if (section) {
				section.items.push(newItem);
				return acc;
			}

			const newSection = { id: group, title: '', items: [newItem] };
			acc.push(newSection);

			return acc;
		}, [] as AdminUserMenuAction);

		return { actions: options, menuActions };
	}, [size, actions]);

	return actionSpread;
};

export const useAdminUserInfoActions = ({
	username,
	userId,
	isFederatedUser,
	isActive,
	isAdmin,
	tab,
	onChange,
	onReload,
}: AdminUserInfoActionsProps) => {
	const { t } = useTranslation();
	const directRoute = useRoute('direct');
	const userRoute = useRoute('admin-users');

	const canDirectMessage = usePermission('create-d');
	const canEditOtherUserInfo = usePermission('edit-other-user-info');

	const changeAdminStatusAction = useChangeAdminStatusAction(userId, isAdmin, onChange);
	const changeUserStatusAction = useChangeUserStatusAction(userId, isActive, onChange);
	const deleteUserAction = useDeleteUserAction(userId, onChange, onReload);
	const resetTOTPAction = useResetTOTPAction(userId);
	const resetE2EKeyAction = useResetE2EEKeyAction(userId);

	const directMessageClick = useCallback(
		() =>
			username &&
			directRoute.push({
				rid: username,
			}),
		[directRoute, username],
	);

	const editUserClick = useCallback(
		() =>
			userRoute.push({
				context: 'edit',
				id: userId,
			}),
		[userId, userRoute],
	);

	const isNotPendingDeactivatedNorFederated = tab !== 'pending' && tab !== 'deactivated' && !isFederatedUser;

	const options = useMemo(
		() => ({
			...(canDirectMessage && {
				directMessage: {
					icon: 'balloon',
					content: t('Direct_Message'),
					onClick: directMessageClick,
				} as AdminUserAction,
			}),
			...(canEditOtherUserInfo && {
				editUsereditUser: {
					icon: 'edit',
					content: t('Edit'),
					title: isFederatedUser ? t('Edit_Federated_User_Not_Allowed') : t('Edit'),
					onClick: editUserClick,
					disabled: isFederatedUser,
				} as AdminUserAction,
			}),
			...(isNotPendingDeactivatedNorFederated && changeAdminStatusAction && { changeAdminStatusAction }),
			...(isNotPendingDeactivatedNorFederated && resetE2EKeyAction && { resetE2EKeyAction }),
			...(isNotPendingDeactivatedNorFederated && resetTOTPAction && { resetTOTPAction }),
			...(changeUserStatusAction && !isFederatedUser && { changeUserStatusAction }),
			...(deleteUserAction && { deleteUserAction }),
		}),
		[
			canDirectMessage,
			canEditOtherUserInfo,
			changeAdminStatusAction,
			changeUserStatusAction,
			deleteUserAction,
			directMessageClick,
			editUserClick,
			isFederatedUser,
			isNotPendingDeactivatedNorFederated,
			resetE2EKeyAction,
			resetTOTPAction,
			t,
		],
	);

	return useAdminUserInfoActionsSpread(options);
};
