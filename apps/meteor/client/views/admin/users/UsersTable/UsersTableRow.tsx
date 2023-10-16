import type { IRole, IUser } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { capitalize } from '@rocket.chat/string-helpers';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { Roles } from '../../../../../app/models/client';
import { GenericTableRow, GenericTableCell } from '../../../../components/GenericTable';
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
		<GenericTableRow
			onKeyDown={(): void => onClick(_id)}
			onClick={(): void => onClick(_id)}
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
			</GenericTableCell>
			{mediaQuery && (
				<GenericTableCell>
					<Box fontScale='p2m' color='hint' withTruncatedText>
						{username}
					</Box>{' '}
					<Box mi={4} />
				</GenericTableCell>
			)}
			<GenericTableCell withTruncatedText>{emails?.length && emails[0].address}</GenericTableCell>
			{mediaQuery && <GenericTableCell withTruncatedText>{roleNames}</GenericTableCell>}
			<GenericTableCell fontScale='p2' color='hint' withTruncatedText>
				{statusText}
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default UsersTableRow;
