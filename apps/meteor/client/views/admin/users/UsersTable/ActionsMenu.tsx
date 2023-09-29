import type { IUser } from '@rocket.chat/core-typings';
import { isUserFederated } from '@rocket.chat/core-typings';
import { Menu, Option } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';

import type { Action } from '../../../hooks/useActionSpread';
import { useChangeAdminStatusAction } from '../hooks/useChangeAdminStatusAction';
import { useDeleteUserAction } from '../hooks/useDeleteUserAction';
import { useResetE2EEKeyAction } from '../hooks/useResetE2EEKeyAction';
import { useResetTOTPAction } from '../hooks/useResetTOTPAction';

type ActionsMenuProps = {
	user: Pick<IUser, '_id' | 'username' | 'name' | 'status' | 'emails' | 'active' | 'avatarETag' | 'roles'>;
	tab: string;
	changeUserStatusAction: Action | undefined;
	onChange: () => void;
	onReload: () => void;
};

const ActionsMenu = ({ user, tab, changeUserStatusAction, onChange, onReload }: ActionsMenuProps): ReactElement | null => {
	const userId = user._id;
	const isAdmin = user.roles?.includes('admin');
	const isFederatedUser = isUserFederated(user);

	const changeAdminStatusAction = useChangeAdminStatusAction(userId, isAdmin, onChange);
	const deleteUserAction = useDeleteUserAction(userId, onChange, onReload);
	const resetTOTPAction = useResetTOTPAction(userId);
	const resetE2EKeyAction = useResetE2EEKeyAction(userId);

	const activeMenuOptions = useMemo(
		() =>
			tab === 'active'
				? {
						...(changeAdminStatusAction &&
							!isFederatedUser && {
								makeAdmin: {
									label: { label: changeAdminStatusAction.label, icon: changeAdminStatusAction.icon },
									action: changeAdminStatusAction.action,
								},
							}),
						...(resetE2EKeyAction &&
							!isFederatedUser && {
								resetE2EKey: { label: { label: resetE2EKeyAction.label, icon: resetE2EKeyAction.icon }, action: resetE2EKeyAction.action },
							}),
						...(resetTOTPAction &&
							!isFederatedUser && {
								resetTOTP: { label: { label: resetTOTPAction.label, icon: resetTOTPAction.icon }, action: resetTOTPAction.action },
							}),
				  }
				: {},
		[changeAdminStatusAction, isFederatedUser, resetE2EKeyAction, resetTOTPAction, tab],
	);

	const menuOptions = useMemo(
		() => ({
			...activeMenuOptions,
			...(changeUserStatusAction &&
				!isFederatedUser && {
					changeActiveStatus: {
						label: { label: changeUserStatusAction.label, icon: changeUserStatusAction.icon },
						action: changeUserStatusAction.action,
					},
				}),
			...(deleteUserAction && {
				delete: { label: { label: deleteUserAction.label, icon: deleteUserAction.icon }, action: deleteUserAction.action },
			}),
		}),
		[activeMenuOptions, changeUserStatusAction, deleteUserAction, isFederatedUser],
	);

	return useMemo(() => {
		if (!menuOptions) {
			return null;
		}

		return (
			<Menu
				placement='bottom-start'
				flexShrink={0}
				key='menu'
				renderItem={({ label: { label, icon }, ...props }): ReactElement =>
					label === 'Delete' ? (
						<Option label={label} title={label} icon={icon} variant='danger' {...props} />
					) : (
						<Option label={label} title={label} icon={icon} {...props} />
					)
				}
				options={menuOptions}
				aria-keyshortcuts='alt'
				tabIndex={-1}
			/>
		);
	}, [menuOptions]);
};

export default ActionsMenu;
