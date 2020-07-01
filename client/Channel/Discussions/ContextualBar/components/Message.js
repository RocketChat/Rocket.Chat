import React from 'react';
import { Box, Icon } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';

import UserAvatar from '../../../../components/basic/avatar/UserAvatar';
import RawText from '../../../../components/basic/RawText';
import MessageTemplate from '../../../components/Message';

function isIterable(obj) {
	// checks for null and undefined
	if (obj == null) {
		return false;
	}
	return typeof obj[Symbol.iterator] === 'function';
}

const followStyle = css`
	& > .rcx-message__container > .rcx-contextual-message__follow {
		opacity: 0;
	}
	.rcx-contextual-message__follow:focus,
	&:hover > .rcx-message__container > .rcx-contextual-message__follow,
	&:focus > .rcx-message__container > .rcx-contextual-message__follow {
		opacity: 1;
	}
`;

export default function Message({ _id, msg, following, username, name, ts, replies, participants, handleFollowButton, unread, mention, all, t = (e) => e, formatDate = (e) => e, tlm, className = [], ...props }) {
	return <Box rcx-contextual-message pi='x20' pb='x16' pbs='x16' display='flex' {...props} className={[...isIterable(className) ? className : [className], !following && followStyle].filter(Boolean)}>
		<MessageTemplate.Container mb='neg-x2'>
			<UserAvatar username={username} rcx-message__avatar size='x36'/>
		</MessageTemplate.Container>
		<MessageTemplate.Container width='1px' mb='neg-x4' flexGrow={1}>
			<MessageTemplate.Header>
				<MessageTemplate.Username title={username}>{name}</MessageTemplate.Username>
				<MessageTemplate.Timestamp ts={formatDate(ts)}/>
			</MessageTemplate.Header>
			<MessageTemplate.BodyClamp><RawText>{msg}</RawText></MessageTemplate.BodyClamp>
			<Box mi='neg-x2' flexDirection='row' display='flex' alignItems='baseline' mbs='x8'>
				<Box display='flex' alignItems='center' is='span' fontSize='x12' color='neutral-700' fontWeight='600'><Icon name='thread' size='x20' mi='x2'/>{replies}</Box>
				<Box display='flex' alignItems='center' is='span' fontSize='x12' color='neutral-700' fontWeight='600'><Icon name='user' size='x20' mi='x2'/>{participants}</Box>
				<Box display='flex' alignItems='center' is='span' fontSize='x12' color='neutral-700' fontWeight='600' withTruncatedText flexShrink={1} mi='x2'><Icon name='clock' size='x20' mi='x2' /> {formatDate(tlm)} </Box>
			</Box>
		</MessageTemplate.Container>
	</Box>;
}
