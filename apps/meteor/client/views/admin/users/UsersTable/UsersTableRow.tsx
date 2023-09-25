import { UserStatus as Status, isUserFederated } from '@rocket.chat/core-typings';
import type { IRole, IUser } from '@rocket.chat/core-typings';
import { Box, Menu, Option } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React from 'react';

import { Roles } from '../../../../../app/models/client';
import { GenericTableRow, GenericTableCell } from '../../../../components/GenericTable';
import { UserStatus } from '../../../../components/UserStatus';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import { useChangeAdminStatusAction } from '../hooks/useChangeAdminStatusAction';
import { useChangeUserStatusAction } from '../hooks/useChangeUserStatusAction';
import { useDeleteUserAction } from '../hooks/useDeleteUserAction';
import { useResetE2EEKeyAction } from '../hooks/useResetE2EEKeyAction';
import { useResetTOTPAction } from '../hooks/useResetTOTPAction';

type UsersTableRowProps = {
	user: Pick<IUser, '_id' | 'username' | 'name' | 'status' | 'emails' | 'active' | 'avatarETag' | 'roles'>;
	onClick: (id: IUser['_id'], e: React.MouseEvent<HTMLElement, MouseEvent> | React.KeyboardEvent<HTMLElement>) => void;
	mediaQuery: boolean;
	refetchUsers: ReturnType<typeof useQuery>['refetch'];
	onReload: () => void;
};

const UsersTableRow = ({ user, onClick, mediaQuery, refetchUsers, onReload }: UsersTableRowProps): ReactElement => {
	const t = useTranslation();
	const { _id, emails, username, name, status, roles, active, avatarETag } = user;
	const registrationStatusText = active ? t('Active') : t('Deactivated');

	const roleNames = (roles || [])
		.map((roleId) => (Roles.findOne(roleId, { fields: { name: 1 } }) as IRole | undefined)?.name)
		.filter((roleName): roleName is string => !!roleName)
		.join(', ');

	const userId = user._id;
	const isAdmin = user.roles?.includes('admin');
	const isActive = user.active;
	const isFederatedUser = isUserFederated(user);

	const onChange = useMutableCallback(() => {
		onReload();
		refetchUsers();
	});

	const changeAdminStatusAction = useChangeAdminStatusAction(userId, isAdmin, onChange);
	const changeUserStatusAction = useChangeUserStatusAction(userId, isActive, onChange);
	const deleteUserAction = useDeleteUserAction(userId, onChange, onReload);
	const resetTOTPAction = useResetTOTPAction(userId);
	const resetE2EKeyAction = useResetE2EEKeyAction(userId);

	const menuOptions = {
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
	};

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
					{username && <UserAvatar size={mediaQuery ? 'x28' : 'x40'} username={username} etag={avatarETag} />}
					<Box display='flex' mi={8} withTruncatedText>
						<Box display='flex' flexDirection='column' alignSelf='center' withTruncatedText>
							<Box fontScale='p2m' color='default' withTruncatedText>
								<Box display='inline' mie='x8'>
									<UserStatus status={status || Status.OFFLINE} />
								</Box>
								{name || username}
							</Box>
							{!mediaQuery && name && (
								<Box fontScale='p2' color='hint' withTruncatedText>
									{`@${username}`}
								</Box>
							)}
						</Box>
					</Box>
				</Box>
			</GenericTableCell>
			{mediaQuery && (
				<GenericTableCell>
					<Box fontScale='p2m' color='hint' withTruncatedText>
						{username}
					</Box>
					<Box mi={4} />
				</GenericTableCell>
			)}

			<GenericTableCell withTruncatedText>{emails?.length && emails[0].address}</GenericTableCell>
			{mediaQuery && <GenericTableCell withTruncatedText>{roleNames}</GenericTableCell>}
			<GenericTableCell fontScale='p2' color='hint' withTruncatedText>
				{registrationStatusText}
			</GenericTableCell>
			<GenericTableCell
				onClick={(e): void => {
					e.stopPropagation();
				}}
			>
				<Menu
					mi={4}
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
				/>
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default UsersTableRow;
