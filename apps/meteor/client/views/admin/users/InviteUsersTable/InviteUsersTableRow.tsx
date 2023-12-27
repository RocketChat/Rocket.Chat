import { UserStatus as Status } from '@rocket.chat/core-typings';
import type { IUser } from '@rocket.chat/core-typings';
import { Box, Menu, Option } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React from 'react';

import { GenericTableRow, GenericTableCell } from '../../../../components/GenericTable';
import { UserStatus } from '../../../../components/UserStatus';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import { useChangeUserStatusAction } from '../hooks/useChangeUserStatusAction';

type UsersTableRowProps = {
	user: Pick<IUser, '_id' | 'username' | 'name' | 'status' | 'emails' | 'active' | 'avatarETag' | 'roles'>;
	onClick: (id: IUser['_id'], e: React.MouseEvent<HTMLElement, MouseEvent> | React.KeyboardEvent<HTMLElement>) => void;
	mediaQuery: boolean;
	refetchUsers: ReturnType<typeof useQuery>['refetch'];
	onReload: () => void;
};

const UsersTableRow = ({ user, onClick, mediaQuery, refetchUsers, onReload }: UsersTableRowProps): ReactElement => {
	const t = useTranslation();
	const { _id, emails, username, name, status, avatarETag } = user;

	// TODO: change
	const inviteStatus: 'pending' | 'accepted' | 'expired' = 'pending';

	const userId = user._id;

	const onChange = useMutableCallback(() => {
		onReload();
		refetchUsers();
	});

	// const deleteUserAction = useDeleteUserAction(userId, onChange, onReload);
	// const changeUserStatusAction = useChangeUserStatusAction(userId, isActive, onChange);

	// TODO: fix
	const resendInviteAction = useResendInviteAction(userId, onChange, onReload);
	const revokeInviteAction = useRevokeInviteAction();
	const deleteInviteRecordAction = useDeleteInviteRecord(userId, onChange, onReload);

	const menuOptions = {
		...(resendInviteAction &&
			inviteStatus === 'pending' && {
				resend: { label: { label: resendInviteAction.label, icon: resendInviteAction.icon }, action: resendInviteAction.action },
			}),
		...(revokeInviteAction &&
			(inviteStatus === 'pending' || inviteStatus === 'accepted') && {
				revoke: { label: { label: revokeInviteAction.label, icon: revokeInviteAction.icon }, action: revokeInviteAction.action },
			}),
		...(deleteInviteRecordAction && {
			delete: { label: { label: deleteInviteRecordAction.label, icon: deleteInviteRecordAction.icon }, action: deleteInviteRecordAction.action },
		}),
	};

	// TODO: create action for this?
	// TODO: implement logic
	// const handleResendWelcomeEmail = () => {
	// 	console.log('Welcome email resent');
	// 	dispatchToastMessage({ type: 'success', message: t('Welcome_email_resent') });
	// };

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
			{tab === 'all' && (
				<GenericTableCell fontScale='p2' color='hint' withTruncatedText>
					{registrationStatusText}
				</GenericTableCell>
			)}

			<GenericTableCell
				display='flex'
				justifyContent='flex-end'
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
