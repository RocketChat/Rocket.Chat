import type { IRole, IUser } from '@rocket.chat/core-typings';
import { Box, TableRow, TableCell } from '@rocket.chat/fuselage';
import { capitalize } from '@rocket.chat/string-helpers';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { Roles } from '../../../../../app/models/client';
import UserAvatar from '../../../../components/avatar/UserAvatar';

type UsersTableRowProps = {
	user: Pick<IUser, '_id' | 'username' | 'name' | 'status' | 'roles' | 'emails' | 'active' | 'avatarETag'>;
	onClick: (id: IUser['_id']) => void;
	mediaQuery: boolean;
};

const UsersTableRow = ({ user, onClick, mediaQuery }: UsersTableRowProps): ReactElement => {
	const t = useTranslation();
	const { _id, emails, username, name, roles, status, active, avatarETag } = user;
	const statusText = active ? t(capitalize(status as string) as TranslationKey) : t('Disabled');

	const roleNames = (roles || [])
		.map((roleId) => (Roles.findOne(roleId, { fields: { name: 1 } }) as IRole | undefined)?.name)
		.filter((roleName): roleName is string => !!roleName)
		.join(', ');

	return (
		<TableRow onKeyDown={(): void => onClick(_id)} onClick={(): void => onClick(_id)} tabIndex={0} role='link' action qa-user-id={_id}>
			<TableCell withTruncatedText>
				<Box display='flex' alignItems='center'>
					{username && <UserAvatar size={mediaQuery ? 'x28' : 'x40'} username={username} etag={avatarETag} />}
					<Box display='flex' mi='x8' withTruncatedText>
						<Box display='flex' flexDirection='column' alignSelf='center' withTruncatedText>
							<Box fontScale='p2m' color='default' withTruncatedText>
								{name || username}
							</Box>
							{!mediaQuery && name && (
								<Box fontScale='p2' color='hint' withTruncatedText>
									{' '}
									{`@${username}`}{' '}
								</Box>
							)}
						</Box>
					</Box>
				</Box>
			</TableCell>
			{mediaQuery && (
				<TableCell>
					<Box fontScale='p2m' color='hint' withTruncatedText>
						{username}
					</Box>{' '}
					<Box mi='x4' />
				</TableCell>
			)}
			<TableCell withTruncatedText>{emails?.length && emails[0].address}</TableCell>
			{mediaQuery && <TableCell withTruncatedText>{roleNames}</TableCell>}
			<TableCell fontScale='p2' color='hint' withTruncatedText>
				{statusText}
			</TableCell>
		</TableRow>
	);
};

export default UsersTableRow;
