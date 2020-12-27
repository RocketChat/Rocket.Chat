import React, { forwardRef } from 'react';
import { Box, ActionButton, Skeleton } from '@rocket.chat/fuselage';

import UserAvatar from './avatar/UserAvatar';
import UserStatus from './UserStatus';
import MarkdownText from './MarkdownText';
import UserName from './UserName';
import UserRoles from './UserRoles';

const clampStyle = {
	display: '-webkit-box',
	overflow: 'hidden',
	WebkitLineClamp: 3,
	WebkitBoxOrient: 'vertical',
	wordBreak: 'break-all',
};

export const Action = ({ label, ...props }) => (
	<ActionButton small title={label} {...props} mi='x2'/>
);

export const Info = (props) => (
	<Box
		mbe='x4'
		is='span'
		fontScale='p1'
		color='hint'
		withTruncatedText
		{...props}
	/>
);

export const Username = ({ name, status = <UserStatus.Offline/>, title, ...props }) => (
	<Box {...props} display='flex' title={title} flexShrink={0} alignItems='center' fontScale='s2' color='default' withTruncatedText>
		{status} <Box mis='x8' flexGrow={1} withTruncatedText>{name}</Box>
	</Box>
);

const Roles = (props) => (
	<UserRoles className='rcx-user-card__roles' {...props} />
);

const Role = (props) => (
	<UserRoles.Item {...props} />
);

const UserCardContainer = forwardRef((props, ref) => <Box rcx-user-card bg='surface' elevation='2' p='x24' display='flex' borderRadius='x2' width='439px' {...props} ref={ref}/>);
const UserCard = forwardRef(({
	className,
	style,
	open,
	name,
	username,
	etag,
	customStatus = <Skeleton width='100%'/>,
	roles,
	bio = <>
		<Skeleton width='100%'/>
		<Skeleton width='100%'/>
		<Skeleton width='100%'/>
	</>,
	status = <UserStatus.Offline/>,
	actions,
	localTime = <Skeleton width='100%'/>,
	onClose,
	nickname,
	t = (e) => e,
}, ref) => <UserCardContainer className={className} ref={ref} style={style}>
	<Box>
		<UserAvatar username={username} etag={etag} size='x124'/>
		{actions && <Box flexGrow={0} display='flex' mb='x8' align='center' justifyContent='center'>
			{actions}
		</Box>}
	</Box>
	<Box display='flex' flexDirection='column' flexGrow={1} flexShrink={1} mis='x24' width='1px'>
		{name
			? <UserName status={status} name={name} username={username} nickname={nickname} />
			: <UserName.Skeleton />}
		{customStatus && <Info>{customStatus}</Info>}
		{(!!roles && <UserRoles className='rcx-user-card__roles'>{roles}</UserRoles>)
			|| (roles === undefined && <UserRoles.Skeleton />)}
		<Info>{localTime}</Info>
		{bio && <Info withTruncatedText={false} style={clampStyle} height='x60'>
			<MarkdownText content={bio}/>
		</Info>}
		{open && <a onClick={open}>{t('See_full_profile')}</a>}
	</Box>
	{onClose && <Box>
		<ActionButton ghost icon='cross' onClick={onClose}/>
	</Box>}
</UserCardContainer>);


export default UserCard;

UserCard.Action = Action;
UserCard.Role = Role;
UserCard.Roles = Roles;
UserCard.Info = Info;
UserCard.Username = Username;
