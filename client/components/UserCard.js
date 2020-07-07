import React from 'react';
import { Box, Tag, Button, Icon, Skeleton } from '@rocket.chat/fuselage';

import { ActionButton } from './basic/Buttons/ActionButton';
import UserAvatar from './basic/avatar/UserAvatar';
import * as Status from './basic/UserStatus';

const style = {
	display: '-webkit-box',
	overflow: 'hidden',
	WebkitLineClamp: 3,
	WebkitBoxOrient: 'vertical',
	wordBreak: 'break-all',
};

export const Action = ({ icon }) => <Button small mi='x2'><Icon name={icon} size='x16' /></Button>;

export const Info = (props) => <Box mb='x4' is='p' fontSize='p1' fontSize='p1' fontScale='p1' letterSpacing='p1' fontWeight='p1' color='hint' withTruncatedText {...props} />;

const Roles = ({ children }) =>
	<Info rcx-user-card__roles mi='neg-x2' height='16px' display='flex'>
		{children}
	</Info>;

const Role = ({ children }) => <Tag
	pb={0}
	mi='x2'
	disabled
	fontSize='c2'
	fontSize='c2'
	fontScale='c2'
	letterSpacing='c2'
	fontWeight='c2'
	children={children}
/>;

const UserCardConteiner = (props) => <Box rcx-user-card elevation='1' p='x24' display='flex' borderRadius='x2' width='439px' heigth='230px' {...props}/>;
const UserCard = ({
	name = <Skeleton width='100%'/>,
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
}) => <UserCardConteiner>
	<Box>
		<UserAvatar size='x124'/>
		{ actions && <Box display='flex' mb='x8' align='center' justifyContent='center'>
			{actions}
		</Box>}
	</Box>
	<Box display='flex' flexDirection='column' flexGrow={1} flexShrink={1} mis='x24' width='1px'>
		<Box display='flex' flexGrow={1} alignItems='center' is='p' fontSize='s2' fontSize='s2' fontScale='s2' letterSpacing='s2' fontWeight='s2' color='default' withTruncatedText>{status} <Box mis='x8' flexGrow={1} withTruncatedText>{name}</Box></Box>
		<Info>{customStatus}</Info>
		<Roles>{roles}</Roles>
		<Info>{localTime}</Info>
		<Info withTruncatedText={false} style={style} height='60px'>{bio}</Info>
		<a href='#'>See Full Profile</a>
	</Box>
	<Box><ActionButton icon='cross'/></Box>
</UserCardConteiner>;


export default UserCard;

UserCard.Action = Action;
UserCard.Role = Role;
