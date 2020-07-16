import React from 'react';
import { Box, Margins, Button, Icon, Skeleton } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';

import UserAvatar from '../../../../client/components/basic/avatar/UserAvatar';
import RawText from '../../../../client/components/basic/RawText';

const borderRadius = css`
	border-radius: 100%;
`;

export function NotificationStatus({ t = (e) => e, label, ...props }) {
	return <Box width='x8' aria-label={t(label)} className={[borderRadius]} height='x8' {...props} />;
}

export function NotificationStatusAll(props) {
	return <NotificationStatus label='mention-all' bg='#F38C39' {...props} />;
}

export function NotificationStatusMe(props) {
	return <NotificationStatus label='Me' bg='danger-500' {...props} />;
}

export function NotificationStatusUnread(props) {
	return <NotificationStatus label='Unread' bg='primary-500' {...props} />;
}

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
		opacity: 1
	}
`;

export default function ThreadListMessage({ _id, msg, following, username, name, ts, replies, participants, handleFollowButton, unread, mention, all, t = (e) => e, formatDate = (e) => e, tlm, className = [], ...props }) {
	const button = !following ? 'bell-off' : 'bell';
	const actionLabel = t(!following ? 'Not_Following' : 'Following');

	return <Box rcx-contextual-message pi='x20' pb='x16' pbs='x16' display='flex' {...props} className={[...isIterable(className) ? className : [className], !following && followStyle].filter(Boolean)}>
		<Container mb='neg-x2'>
			<UserAvatar username={username} rcx-message__avatar size='x36'/>
		</Container>
		<Container width='1px' mb='neg-x4' flexGrow={1}>
			<Header>
				<Username title={username}>{name}</Username>
				<Timestamp ts={formatDate(ts)}/>
			</Header>
			<Body><RawText>{msg}</RawText></Body>
			<Box mi='neg-x2' flexDirection='row' display='flex' alignItems='baseline' mbs='x8'>
				<Margins inline='x2'>
					<Box display='flex' alignItems='center' is='span' fontSize='x12' color='neutral-700' fontWeight='600'><Icon name='thread' size='x20' mi='x2'/> {replies} </Box>
					<Box display='flex' alignItems='center' is='span' fontSize='x12' color='neutral-700' fontWeight='600'><Icon name='user' size='x20' mi='x2'/> {participants} </Box>
					<Box display='flex' alignItems='center' is='span' fontSize='x12' color='neutral-700' fontWeight='600' withTruncatedText flexShrink={1}><Icon name='clock' size='x20' mi='x2' /> {formatDate(tlm)} </Box>
				</Margins>
			</Box>
		</Container>
		<Container alignItems='center'>
			<Button rcx-contextual-message__follow small square flexShrink={0} ghost data-following={following} data-id={_id} onClick={handleFollowButton} title={actionLabel} aria-label={actionLabel}><Icon name={button} size='x20'/></Button>
			{
				(mention && <NotificationStatusMe t={t} mb='x24'/>)
				|| (all && <NotificationStatusAll t={t} mb='x24'/>)
				|| (unread && <NotificationStatusUnread t={t} mb='x24'/>)
			}
		</Container>
	</Box>;
}

export function MessageSkeleton(props) {
	return <Box rcx-message pi='x20' pb='x16' pbs='x16' display='flex' {...props}>
		<Container mb='neg-x2'>
			<Skeleton variant='rect' size='x36'/>
		</Container>
		<Container width='1px' mb='neg-x4' flexGrow={1}>
			<Header>
				<Skeleton width='100%'/>
			</Header>
			<Body><Skeleton /><Skeleton /></Body>
			<Box mi='neg-x8' flexDirection='row' display='flex' alignItems='baseline' mb='x8'>
				<Margins inline='x4'>
					<Skeleton />
					<Skeleton />
					<Skeleton />
				</Margins>
			</Box>
		</Container>
	</Box>;
}

function Container({ children, ...props }) {
	return <Box rcx-message__container display='flex' mi='x4' flexDirection='column' {...props}><Margins block='x2'>{children}</Margins></Box>;
}

function Header({ children }) {
	return <Box rcx-message__header display='flex' flexGrow={0} flexShrink={1} withTruncatedText><Box mi='neg-x2' display='flex' flexDirection='row' alignItems='baseline' withTruncatedText flexGrow={1	} flexShrink={1}><Margins inline='x2'> {children} </Margins></Box></Box>;
}

function Username(props) {
	return <Box rcx-message__username color='neutral-800' fontSize='x14' fontWeight='600' flexShrink={1} withTruncatedText {...props}/>;
}

function Timestamp({ ts }) {
	return <Box rcx-message__time fontSize='c1' color='neutral-600' flexShrink={0} withTruncatedText>{ts.toDateString ? ts.toDateString() : ts }</Box>;
}

const style = {
	display: '-webkit-box',
	overflow: 'hidden',
	WebkitLineClamp: 2,
	WebkitBoxOrient: 'vertical',
	wordBreak: 'break-all',
};

function Body(props) {
	return <Box rcx-message__body flexShrink={1} style={style} lineHeight='1.45' minHeight='40px' {...props}/>;
}
