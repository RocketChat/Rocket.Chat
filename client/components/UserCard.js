import React from 'react';
import { Box, Tag, Button, Icon } from '@rocket.chat/fuselage';

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

const Roles = ({ roles }) =>
	<Info mi='neg-x2'>
		{roles.map((role, index) => (
			<Tag
				pb={0}
				mi='x2'
				disabled
				fontSize='c2'
				fontSize='c2'
				fontScale='c2'
				letterSpacing='c2'
				fontWeight='c2'
				key={index}
			>
				{role}
			</Tag>
		))}
	</Info>;

const UserCard = ({ name, customStatus, roles = [], bio, status = <Status.Offline/>, actions }) => <Box rcx-user-card elevation='1' p='x24' display='flex' borderRadius='x2' width='439px' heigth='230px'>
	<Box><UserAvatar size='x124'/>
		{ actions && <Box display='flex' mb='x8' align='center' justifyContent='center'>
			{actions}
		</Box>}
	</Box>
	<Box display='flex' flexDirection='column' flexGrow={1} flexShrink={1} mis='x24' width='1px'>
		<Box display='flex' alignItems='center' is='p' fontSize='s2' fontSize='s2' fontScale='s2' letterSpacing='s2' fontWeight='s2' color='default' withTruncatedText>{status} <Box mi='x8' withTruncatedText>{name}</Box></Box>
		<Info>{customStatus}</Info>
		{roles.length > <Roles roles={roles}/>}
		<Info >Local Time: 7:44 AM</Info>
		<Info withTruncatedText={false} style={style}>{bio}</Info>
		<a href='#'>See Full Profile</a>
	</Box>
	<Box><ActionButton icon='cross'/></Box>
</Box>;


export default UserCard;
