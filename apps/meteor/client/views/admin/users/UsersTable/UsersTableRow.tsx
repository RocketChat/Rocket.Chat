import type { IRole, IUser } from '@rocket.chat/core-typings';
import { UserStatus as Status } from '@rocket.chat/core-typings';
import { Box, Button } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React from 'react';

import { Roles } from '../../../../../app/models/client';
import { GenericTableCell, GenericTableRow } from '../../../../components/GenericTable';
import { UserStatus } from '../../../../components/UserStatus';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import ActionsMenu from './ActionsMenu';

type UsersTableRowProps = {
	user: Pick<IUser, '_id' | 'username' | 'name' | 'status' | 'roles' | 'emails' | 'active' | 'avatarETag' | 'lastLogin'>;
	onClick: (id: IUser['_id'], e: React.MouseEvent<HTMLElement, MouseEvent> | React.KeyboardEvent<HTMLElement>) => void;
	mediaQuery: boolean;
	refetchUsers: ReturnType<typeof useQuery>['refetch'];
	onReload: () => void;
	tab: string;
};

const UsersTableRow = ({ user, onClick, mediaQuery, refetchUsers, onReload, tab }: UsersTableRowProps): ReactElement => {
	const t = useTranslation();
	const { _id, emails, username, name, status, roles, active, avatarETag } = user as IUser;
	const registrationStatusText = active ? t('Active') : t('Deactivated');

	const roleNames = (roles || [])
		.map((roleId) => (Roles.findOne(roleId, { fields: { name: 1 } }) as IRole | undefined)?.name)
		.filter((roleName): roleName is string => !!roleName)
		.join(', ');

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
			{tab === 'all' && (
				<GenericTableCell fontScale='p2' color='hint' withTruncatedText>
					{registrationStatusText}
				</GenericTableCell>
			)}
			{tab === 'all' && (
				<GenericTableCell fontScale='p2' color='hint' withTruncatedText>
					{/* TODO: add token here? */}
					{`${username}-token123`}
				</GenericTableCell>
			)}
			{tab === 'pending' && (
				<GenericTableCell
					fontScale='p2'
					color='hint'
					onClick={(e): void => {
						e.stopPropagation();
					}}
					w='fit-content'
				>
					<Box display='flex' flexDirection='row' alignContent='flex-end'>
						{active ? t('User_first_log_in') : t('Activation')}
					</Box>
				</GenericTableCell>
			)}

			<GenericTableCell display='flex' flexDirection='row'>
				{tab === 'pending' &&
					(active ? (
						<Button small secondary mie='x16'>
							{t('Resend_welcome_email')}
						</Button>
					) : (
						<Button small primary mie='x16'>
							{t('Activate')}
						</Button>
					))}
				<ActionsMenu user={user} refetchUsers={refetchUsers} onReload={onReload} tab={tab} />
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default UsersTableRow;
