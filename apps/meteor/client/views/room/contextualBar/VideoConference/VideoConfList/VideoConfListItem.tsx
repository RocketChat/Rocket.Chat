import { IGroupVideoConference } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Button, Icon, Message, Box, Avatar } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import RawText from '../../../../../components/RawText';
import UserAvatar from '../../../../../components/avatar/UserAvatar';
import { useTimeAgo } from '../../../../../hooks/useTimeAgo';

const VideoConfListItem = ({
	videoConfData,
	className = [],
	...props
}: {
	videoConfData: IGroupVideoConference;
	className: string[];
}): ReactElement => {
	const t = useTranslation();
	const formatDate = useTimeAgo();

	const {
		createdBy: { name, username, _id },
		title,
		users,
		url,
		createdAt,
	} = videoConfData;

	const joinedUsers = users.filter((user) => user._id !== _id);

	const hovered = css`
		&:hover,
		&:focus {
			background: ${colors.n100};
			.rcx-message {
				background: ${colors.n100};
			}
		}
		border-bottom: 2px solid ${colors.n300} !important;
	`;

	return (
		<Box className={[...className, hovered].filter(Boolean)} pb='x8'>
			{/* <Message {...props} className={[...(isIterable(className) ? className : [className]), !following && followStyle].filter(Boolean)}> */}
			<Message {...props}>
				<Message.LeftContainer>
					<UserAvatar username={username} className='rcx-message__avatar' size='x36' />
				</Message.LeftContainer>
				<Message.Container>
					<Message.Header>
						<Message.Name title={username}>{name}</Message.Name>
						<Message.Timestamp>{formatDate(createdAt)}</Message.Timestamp>
					</Message.Header>
					<Message.Body clamp={2}>
						<RawText>{title}</RawText>
					</Message.Body>
					<Box display='flex'></Box>
					<Message.Block flexDirection='row' alignItems='center'>
						<Button is='a' href={url} external primary small alignItems='center' display='flex'>
							<Icon size='x20' name='video' mie='x4' />
							{t('Join')}
						</Button>
						{joinedUsers.length > 0 && (
							<Box mis='x8'>
								<Avatar.Stack>
									{joinedUsers.map((user) => (
										<UserAvatar username={user.username} size='x28' />
									))}
								</Avatar.Stack>
							</Box>
						)}
						{joinedUsers.length === 0 && (
							<Box mis='x8' fontScale='c1'>
								Be first to join
							</Box>
						)}
					</Message.Block>
				</Message.Container>
				{/* <Message.ContainerFixed>
					<Button
						className={anchor}
						small
						square
						flexShrink={0}
						ghost
						data-following={following}
						data-id={_id}
						onClick={handleFollowButton}
						title={actionLabel}
						aria-label={actionLabel}
					>
						<Icon name={button} size='x20' />
					</Button>
					{(mention && <NotificationStatus.Me mb='x24' />) ||
						(all && <NotificationStatus.All mb='x24' />) ||
						(unread && <NotificationStatus.Unread mb='x24' />)}
				</Message.ContainerFixed> */}
			</Message>
		</Box>
	);
};

export default VideoConfListItem;
