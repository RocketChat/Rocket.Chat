import React, { forwardRef } from 'react';
import { Box, Tag, ActionButton, Skeleton } from '@rocket.chat/fuselage';

import UserAvatar from './avatar/UserAvatar';
import * as Status from './UserStatus';
import MarkdownText from './MarkdownText';

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

export const Username = ({ name, status = <Status.Offline/>, title, ...props }) => <Box {...props} display='flex' title={title} flexShrink={0} alignItems='center' fontScale='s2' color='default' withTruncatedText>
	{status} <Box mis='x8' flexGrow={1} withTruncatedText>{name}</Box>
</Box>;

const Roles = ({ children }) => <Info rcx-user-card__roles m='neg-x2' flexWrap='wrap' display='flex' flexShrink={0}>
	{children}
</Info>;

const Role = ({ children }) => <Box m='x2' fontScale='c2'><Tag
	disabled
	children={children}
/></Box>;

const UserCardContainer = forwardRef((props, ref) => <Box rcx-user-card bg='surface' elevation='2' p='x24' display='flex' borderRadius='x2' width='439px' {...props} ref={ref}/>);
const UserCard = forwardRef(({
	className,
	style,
	open,
	name = <Skeleton width='100%'/>,
	username,
	etag,
	customStatus = <Skeleton width='100%'/>,
	roles = <>
		<Skeleton width='32%' mi='x2'/>
		<Skeleton width='32%' mi='x2'/>
		<Skeleton width='32%' mi='x2'/>
	</>,
	bio = <>
		<Skeleton width='100%'/>
		<Skeleton width='100%'/>
		<Skeleton width='100%'/>
	</>,
	status = <Status.Offline/>,
	actions,
	localTime = <Skeleton width='100%'/>,
	onClose,
	nickname,
	t = (e) => e,
}, ref) => <UserCardContainer className={className} ref={ref} style={style}>
	<Box>
		<UserAvatar username={username} etag={etag} size='x124'/>
		{ actions && <Box flexGrow={0} display='flex' mb='x8' align='center' justifyContent='center'>
			{actions}
		</Box>}
	</Box>
	<Box display='flex' flexDirection='column' flexGrow={1} flexShrink={1} mis='x24' width='1px'>
		<Box withTruncatedText display='flex'>
			<Username status={status} name={name} title={username !== name ? username : undefined} />
			{nickname && <Box title={t('Nickname')} color='hint' mis='x8' fontScale='p1' withTruncatedText>({ nickname })</Box>}
		</Box>
		{ customStatus && <Info>{typeof customStatus === 'string' ? <MarkdownText content={customStatus} /> : customStatus}</Info> }
		<Roles>{roles}</Roles>
		<Info>{localTime}</Info>
		{ bio && <Info withTruncatedText={false} style={clampStyle} height='x60'>{typeof bio === 'string' ? <MarkdownText content={bio}/> : bio}</Info> }
		{open && <a onClick={open}>{t('See_full_profile')}</a>}
	</Box>
	{onClose && <Box><ActionButton ghost icon='cross' onClick={onClose}/></Box>}
</UserCardContainer>);


export default UserCard;

UserCard.Action = Action;
UserCard.Role = Role;
UserCard.Roles = Roles;
UserCard.Info = Info;
UserCard.Username = Username;
