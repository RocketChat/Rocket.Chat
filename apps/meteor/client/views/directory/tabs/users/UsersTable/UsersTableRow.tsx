import type { IUser, Serialized } from '@rocket.chat/core-typings';
import { Box, Flex } from '@rocket.chat/fuselage';
import React from 'react';

import { GenericTableRow, GenericTableCell } from '../../../../../components/GenericTable';
import MarkdownText from '../../../../../components/MarkdownText';
import UserAvatar from '../../../../../components/avatar/UserAvatar';
import { useFormatDate } from '../../../../../hooks/useFormatDate';

type UsersTableRowProps = {
	user: Serialized<IUser> & { domain?: string };
	onClick: (username: IUser['username']) => (e: React.KeyboardEvent | React.MouseEvent) => void;
	mediaQuery: boolean;
	federation: boolean;
	canViewFullOtherUserInfo: boolean;
};

const UsersTableRow = ({
	user: { createdAt, emails, domain, _id, username, name, bio, avatarETag, nickname },
	onClick,
	mediaQuery,
	federation,
	canViewFullOtherUserInfo,
}: UsersTableRowProps) => {
	const formatDate = useFormatDate();

	return (
		<GenericTableRow key={_id} onKeyDown={onClick(username)} onClick={onClick(username)} tabIndex={0} role='link' action>
			<GenericTableCell>
				<Flex.Container>
					<Box>
						<Flex.Item>{username && <UserAvatar size='x40' title={username} username={username} etag={avatarETag} />}</Flex.Item>
						<Box withTruncatedText mi={8}>
							<Box display='flex'>
								<Box fontScale='p2m' withTruncatedText>
									{name || username}
									{nickname && ` (${nickname})`}
								</Box>{' '}
								<Box mi={4} />{' '}
								<Box fontScale='p2' color='hint' withTruncatedText>
									{username}
								</Box>
							</Box>
							<MarkdownText variant='inline' fontScale='p2' color='hint' content={bio} />
						</Box>
					</Box>
				</Flex.Container>
			</GenericTableCell>
			{mediaQuery && canViewFullOtherUserInfo && (
				<GenericTableCell withTruncatedText>{emails?.length && emails[0].address}</GenericTableCell>
			)}
			{federation && <GenericTableCell withTruncatedText>{domain}</GenericTableCell>}
			{mediaQuery && (
				<GenericTableCell fontScale='p2' color='hint' withTruncatedText>
					{formatDate(createdAt)}
				</GenericTableCell>
			)}
		</GenericTableRow>
	);
};

export default UsersTableRow;
