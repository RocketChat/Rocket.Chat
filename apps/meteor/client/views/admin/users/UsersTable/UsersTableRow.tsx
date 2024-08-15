import { UserStatus as Status } from '@rocket.chat/core-typings';
import type { IRole, IUser, Serialized } from '@rocket.chat/core-typings';
import { Box, Button, Menu, Option } from '@rocket.chat/fuselage';
import type { DefaultUserInfo } from '@rocket.chat/rest-typings';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';

import { Roles } from '../../../../../app/models/client';
import { GenericTableRow, GenericTableCell } from '../../../../components/GenericTable';
import { UserStatus } from '../../../../components/UserStatus';
import type { AdminUserTab } from '../AdminUsersPage';
import { useChangeAdminStatusAction } from '../hooks/useChangeAdminStatusAction';
import { useChangeUserStatusAction } from '../hooks/useChangeUserStatusAction';
import { useDeleteUserAction } from '../hooks/useDeleteUserAction';
import { useResetE2EEKeyAction } from '../hooks/useResetE2EEKeyAction';
import { useResetTOTPAction } from '../hooks/useResetTOTPAction';
import { useSendWelcomeEmailMutation } from '../hooks/useSendWelcomeEmailMutation';

type UsersTableRowProps = {
	user: Serialized<DefaultUserInfo>;
	onClick: (id: IUser['_id'], e: React.MouseEvent<HTMLElement, MouseEvent> | React.KeyboardEvent<HTMLElement>) => void;
	isMobile: boolean;
	isLaptop: boolean;
	onReload: () => void;
	tab: AdminUserTab;
	isSeatsCapExceeded: boolean;
};

const UsersTableRow = ({ user, onClick, onReload, isMobile, isLaptop, tab, isSeatsCapExceeded }: UsersTableRowProps): ReactElement => {
	const t = useTranslation();

	const { _id, emails, username, name, roles, status, active, avatarETag, lastLogin, type } = user;
	const registrationStatusText = useMemo(() => {
		const usersExcludedFromPending = ['bot', 'app'];

		if (!lastLogin && !usersExcludedFromPending.includes(type)) {
			return t('Pending');
		}

		if (active && lastLogin) {
			return t('Active');
		}

		if (!active && lastLogin) {
			return t('Deactivated');
		}
	}, [active, lastLogin, t, type]);

	const roleNames = (roles || [])
		.map((roleId) => (Roles.findOne(roleId, { fields: { name: 1 } }) as IRole | undefined)?.name)
		.filter((roleName): roleName is string => !!roleName)
		.join(', ');

	const userId = user._id;
	const isAdmin = user.roles?.includes('admin');
	const isActive = user.active;
	const isFederatedUser = !!user.federated;

	const changeAdminStatusAction = useChangeAdminStatusAction(userId, isAdmin, onReload);
	const changeUserStatusAction = useChangeUserStatusAction(userId, isActive, onReload);
	const deleteUserAction = useDeleteUserAction(userId, onReload, onReload);
	const resetTOTPAction = useResetTOTPAction(userId);
	const resetE2EKeyAction = useResetE2EEKeyAction(userId);
	const resendWelcomeEmail = useSendWelcomeEmailMutation();

	const isNotPendingDeactivatedNorFederated = tab !== 'pending' && tab !== 'deactivated' && !isFederatedUser;
	const menuOptions = useMemo(
		() => ({
			...(isNotPendingDeactivatedNorFederated &&
				changeAdminStatusAction && {
					makeAdmin: {
						label: { label: changeAdminStatusAction.label, icon: changeAdminStatusAction.icon },
						action: changeAdminStatusAction.action,
					},
				}),
			...(isNotPendingDeactivatedNorFederated &&
				resetE2EKeyAction && {
					resetE2EKey: { label: { label: resetE2EKeyAction.label, icon: resetE2EKeyAction.icon }, action: resetE2EKeyAction.action },
				}),
			...(isNotPendingDeactivatedNorFederated &&
				resetTOTPAction && {
					resetTOTP: { label: { label: resetTOTPAction.label, icon: resetTOTPAction.icon }, action: resetTOTPAction.action },
				}),
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
		[
			changeAdminStatusAction,
			changeUserStatusAction,
			deleteUserAction,
			isFederatedUser,
			isNotPendingDeactivatedNorFederated,
			resetE2EKeyAction,
			resetTOTPAction,
		],
	);

	const handleResendWelcomeEmail = () => resendWelcomeEmail.mutateAsync({ email: emails?.[0].address });

	return (
		<GenericTableRow
			onKeyDown={(e): void => onClick(_id, e)}
			onClick={(e): void => onClick(_id, e)}
			tabIndex={0}
			role='link'
			action
			qa-user-id={_id}
		>
			<GenericTableCell withTruncatedText>
				<Box display='flex' alignItems='center'>
					{username && <UserAvatar size={isMobile || isLaptop ? 'x28' : 'x40'} username={username} etag={avatarETag} />}
					<Box display='flex' flexGrow={1} flexShrink={1} flexBasis='0%' alignSelf='center' alignItems='center' withTruncatedText>
						<Box mi={8}>
							<UserStatus status={status || Status.OFFLINE} />
						</Box>
						<Box fontScale='p2' withTruncatedText>
							{name || username}
						</Box>
					</Box>
				</Box>
			</GenericTableCell>

			<GenericTableCell>
				<Box fontScale='p2m' color='hint' withTruncatedText>
					{username}
				</Box>
			</GenericTableCell>

			{!isLaptop && <GenericTableCell withTruncatedText>{emails?.length && emails[0].address}</GenericTableCell>}

			{!isLaptop && <GenericTableCell withTruncatedText>{roleNames}</GenericTableCell>}

			{tab === 'all' && !isMobile && (
				<GenericTableCell fontScale='p2' color='hint' withTruncatedText>
					{registrationStatusText}
				</GenericTableCell>
			)}

			{tab === 'pending' && !isMobile && (
				<GenericTableCell fontScale='p2' color='hint' withTruncatedText>
					<Box display='flex' flexDirection='row' alignContent='flex-end'>
						{active ? t('User_first_log_in') : t('Activation')}
					</Box>
				</GenericTableCell>
			)}

			<GenericTableCell
				onClick={(e): void => {
					e.stopPropagation();
				}}
			>
				<Box display='flex' justifyContent='flex-end'>
					{tab === 'pending' && (
						<>
							{active ? (
								<Button small secondary onClick={handleResendWelcomeEmail}>
									{t('Resend_welcome_email')}
								</Button>
							) : (
								<Button small primary onClick={changeUserStatusAction?.action} disabled={isSeatsCapExceeded}>
									{t('Activate')}
								</Button>
							)}
						</>
					)}

					<Menu
						mi={4}
						placement='bottom-start'
						flexShrink={0}
						key='menu'
						renderItem={({ label: { label, icon }, ...props }): ReactElement => (
							<Option label={label} title={label} icon={icon} variant={label === 'Delete' ? 'danger' : ''} {...props} />
						)}
						options={menuOptions}
					/>
				</Box>
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default UsersTableRow;
