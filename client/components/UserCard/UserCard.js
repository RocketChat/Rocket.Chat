import { Box, ActionButton, Skeleton } from '@rocket.chat/fuselage';
import React, { forwardRef } from 'react';

import MarkdownText from '../MarkdownText';
import * as Status from '../UserStatus';
import UserAvatar from '../avatar/UserAvatar';
import Info from './Info';
import Roles from './Roles';
import UserCardContainer from './UserCardContainer';
import Username from './Username';

const clampStyle = {
	display: '-webkit-box',
	overflow: 'hidden',
	WebkitLineClamp: 3,
	WebkitBoxOrient: 'vertical',
	wordBreak: 'break-all',
};

const UserCard = forwardRef(function UserCard(
	{
		className,
		style,
		open,
		name = <Skeleton width='100%' />,
		username,
		etag,
		customStatus = <Skeleton width='100%' />,
		roles = (
			<>
				<Skeleton width='32%' mi='x2' />
				<Skeleton width='32%' mi='x2' />
				<Skeleton width='32%' mi='x2' />
			</>
		),
		bio = (
			<>
				<Skeleton width='100%' />
				<Skeleton width='100%' />
				<Skeleton width='100%' />
			</>
		),
		status = <Status.Offline />,
		actions,
		localTime = <Skeleton width='100%' />,
		onClose,
		nickname,
		t = (e) => e,
	},
	ref,
) {
	return (
		<UserCardContainer className={className} ref={ref} style={style}>
			<Box>
				<UserAvatar username={username} etag={etag} size='x124' />
				{actions && (
					<Box flexGrow={0} display='flex' mb='x8' align='center' justifyContent='center'>
						{actions}
					</Box>
				)}
			</Box>
			<Box display='flex' flexDirection='column' flexGrow={1} flexShrink={1} mis='x24' width='1px'>
				<Box withTruncatedText display='flex'>
					<Username status={status} name={name} title={username !== name ? username : undefined} />
					{nickname && (
						<Box title={t('Nickname')} color='hint' mis='x8' fontScale='p2' withTruncatedText>
							({nickname})
						</Box>
					)}
				</Box>
				{customStatus && (
					<Info>{typeof customStatus === 'string' ? <MarkdownText content={customStatus} parseEmoji={true} /> : customStatus}</Info>
				)}
				<Roles>{roles}</Roles>
				<Info>{localTime}</Info>
				{bio && (
					<Info withTruncatedText={false} style={clampStyle} height='x60'>
						{typeof bio === 'string' ? <MarkdownText content={bio} /> : bio}
					</Info>
				)}
				{open && <a onClick={open}>{t('See_full_profile')}</a>}
			</Box>
			{onClose && (
				<Box>
					<ActionButton ghost icon='cross' onClick={onClose} />
				</Box>
			)}
		</UserCardContainer>
	);
});

export default UserCard;
