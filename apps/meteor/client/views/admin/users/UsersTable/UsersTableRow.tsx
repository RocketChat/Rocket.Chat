import { UserStatus as Status } from '@rocket.chat/core-typings';
import type { IAdminUserTabs, IRole, IUser, Serialized } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import type { PickedUser } from '@rocket.chat/rest-typings';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';

import { Roles } from '../../../../../app/models/client';
import { GenericTableRow, GenericTableCell } from '../../../../components/GenericTable';
import { UserStatus } from '../../../../components/UserStatus';

type UsersTableRowProps = {
	user: Serialized<PickedUser>;
	onClick: (id: IUser['_id'], e: React.MouseEvent<HTMLElement, MouseEvent> | React.KeyboardEvent<HTMLElement>) => void;
	mediaQuery: boolean;
	tab: IAdminUserTabs;
};

const UsersTableRow = ({ user, onClick, mediaQuery, tab }: UsersTableRowProps): ReactElement => {
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
			{mediaQuery && <GenericTableCell withTruncatedText>{emails?.length && emails[0].address}</GenericTableCell>}
			{mediaQuery && <GenericTableCell withTruncatedText>{roleNames}</GenericTableCell>}
			{tab === 'all' && (
				<GenericTableCell fontScale='p2' color='hint' withTruncatedText>
					{registrationStatusText}
				</GenericTableCell>
			)}
		</GenericTableRow>
	);
};

export default UsersTableRow;
