import type { IDirectoryUserResult, IUser, Serialized } from '@rocket.chat/core-typings';
import { Box, FlexContainer, FlexItem } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { GenericTableRow, GenericTableCell } from '@rocket.chat/ui-client';
import type { KeyboardEvent, MouseEvent } from 'react';

import MarkdownText from '../../../../../components/MarkdownText';
import { useFormatDate } from '../../../../../hooks/useFormatDate';

type UsersTableRowProps = {
	user: Serialized<IDirectoryUserResult> & { domain?: string };
	onClick: (username: IUser['username']) => (e: KeyboardEvent | MouseEvent) => void;
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
				<FlexContainer>
					<Box>
						<FlexItem>{username && <UserAvatar size='x40' title={username} username={username} etag={avatarETag} />}</FlexItem>
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
				</FlexContainer>
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
