import type { IUser, Serialized } from '@rocket.chat/core-typings';
import { Box, Flex, TableRow, TableCell } from '@rocket.chat/fuselage';
import React from 'react';

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
		<TableRow key={_id} onKeyDown={onClick(username)} onClick={onClick(username)} tabIndex={0} role='link' action>
			<TableCell>
				<Flex.Container>
					<Box>
						<Flex.Item>{username && <UserAvatar size='x40' title={username} username={username} etag={avatarETag} />}</Flex.Item>
						<Box withTruncatedText mi='x8'>
							<Box display='flex'>
								<Box fontScale='p2m' withTruncatedText>
									{name || username}
									{nickname && ` (${nickname})`}
								</Box>{' '}
								<Box mi='x4' />{' '}
								<Box fontScale='p2' color='hint' withTruncatedText>
									{username}
								</Box>
							</Box>
							<MarkdownText variant='inline' fontScale='p2' color='hint' content={bio} />
						</Box>
					</Box>
				</Flex.Container>
			</TableCell>
			{mediaQuery && canViewFullOtherUserInfo && <TableCell withTruncatedText>{emails?.length && emails[0].address}</TableCell>}
			{federation && <TableCell withTruncatedText>{domain}</TableCell>}
			{mediaQuery && (
				<TableCell fontScale='p2' color='hint' withTruncatedText>
					{formatDate(createdAt)}
				</TableCell>
			)}
		</TableRow>
	);
};

export default UsersTableRow;
