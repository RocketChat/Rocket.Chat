import type { IDirectoryUserResult, IUser, Serialized } from '@rocket.chat/core-typings';
import { Box, FlexContainer, FlexItem, Text } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { GenericTableRow, GenericTableCell } from '@rocket.chat/ui-client';
import type { KeyboardEvent, MouseEvent } from 'react';

import MarkdownText from '../../../../../components/MarkdownText';
import { useFormatDate } from '../../../../../hooks/useFormatDate';

export type UsersTableRowProps = {
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
						<Box withTruncatedText marginInline={8}>
							<Box display='flex'>
								<Text fontScale='p2m' truncate>
									{name || username}
									{nickname && ` (${nickname})`}
								</Text>{' '}
								<Box marginInline={4} />{' '}
								<Text fontScale='p2' color='hint' truncate>
									{username}
								</Text>
							</Box>
							<MarkdownText variant='inline' fontScale='p2' color='hint' content={bio} />
						</Box>
					</Box>
				</FlexContainer>
			</GenericTableCell>
			{mediaQuery && canViewFullOtherUserInfo && <GenericTableCell truncate>{emails?.length && emails[0].address}</GenericTableCell>}
			{federation && <GenericTableCell truncate>{domain}</GenericTableCell>}
			{mediaQuery && (
				<GenericTableCell color='hint' truncate>
					{formatDate(createdAt)}
				</GenericTableCell>
			)}
		</GenericTableRow>
	);
};

export default UsersTableRow;
