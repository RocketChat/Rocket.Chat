import React, { forwardRef } from 'react';
import { Box, Tag, Button, Icon, Skeleton } from '@rocket.chat/fuselage';

import { ActionButton } from './Buttons/ActionButton';
import UserAvatar from './avatar/UserAvatar';
import * as Status from './UserStatus';

const clampStyle = {
	display: '-webkit-box',
	overflow: 'hidden',
	WebkitLineClamp: 3,
	WebkitBoxOrient: 'vertical',
	wordBreak: 'break-all',
};

export const Action = ({ icon, ...props }) => (
	<Button {...props} small mi='x2'>
		<Icon name={icon} size='x16' />
	</Button>
);

export const Info = (props) => (
	<Box
		mb='x4'
		is='span'
		fontSize='p1'
		fontScale='p1'
		color='hint'
		withTruncatedText
		{...props}
	/>
);

export const Username = ({ name, status = <Status.Offline/> }) => <Box display='flex' flexShrink={0} alignItems='center' fontScale='s2' color='default' withTruncatedText>
	{status} <Box mis='x8' flexGrow={1} withTruncatedText>{name}</Box>
</Box>;

const Roles = ({ children }) => <Info rcx-user-card__roles mi='neg-x2' height='16px' display='flex' flexShrink={0}>
	{children}
</Info>;

const Role = ({ children }) => <Tag
	pb={0}
	mi='x2'
	disabled
	fontScale='c2'
	children={children}
/>;

const UserCardConteiner = forwardRef((props, ref) => <Box rcx-user-card bg='surface' elevation='2' p='x24' display='flex' borderRadius='x2' width='439px' heigth='230px' {...props} ref={ref}/>);
const UserCard = forwardRef(({
	className,
	style,
	open,
	name = <Skeleton width='100%'/>,
	username,
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
	t = (e) => e,
}, ref) => <UserCardConteiner className={className} ref={ref} style={style}>
	<Box>
		<UserAvatar username={username} size='x124'/>
		{ actions && <Box display='flex' mb='x8' align='center' justifyContent='center'>
			{actions}
		</Box>}
	</Box>
	<Box display='flex' flexDirection='column' flexGrow={1} flexShrink={1} mis='x24' width='1px'>
		<Username status={status} name={name}/>
		<Info>{customStatus}</Info>
		<Roles>{roles}</Roles>
		<Info>{localTime}</Info>
		<Info withTruncatedText={false} style={clampStyle} height='60px'>{bio}</Info>
		{open && <a onClick={open}>{t('See_full_profile')}</a>}
	</Box>
	{onClose && <Box><ActionButton icon='cross' onClick={onClose}/></Box>}
</UserCardConteiner>);


export default UserCard;

UserCard.Action = Action;
UserCard.Role = Role;
UserCard.Roles = Roles;
UserCard.Info = Info;
UserCard.Username = Username;
