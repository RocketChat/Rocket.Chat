import React from 'react';
import { Box, Margins, Button, Icon, Skeleton } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';

import UserAvatar from '../../../../client/components/basic/avatar/UserAvatar';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import RawText from '../../../../client/components/basic/RawText';

const borderRadius = css`{
	border-radius: 100%;
}`;

export function NotificationStatus(props) {
	return <Box width='x8' className={[borderRadius]} height='x8' {...props} />;
}

export function NotificationStatusAll() {
	const t = useTranslation();
	return <NotificationStatus aria-label={t('mention-all')}bg='#F38C39'/>;
}

export function NotificationStatusMe() {
	const t = useTranslation();
	return <NotificationStatus aria-label={t('Me')} bg='danger-500'/>;
}

export function NotificationStatusUnread() {
	const t = useTranslation();
	return <NotificationStatus aria-label={t('Unread')} bg='primary-500'/>;
}

export default function ThreadListMessage({ _id, msg, following, username, ts, replies, participants, handleFollowButton, unread, mention, all, formatDate = (e) => e, tlm, ...props }) {
	const t = useTranslation();

	const button = !following ? 'bell-off' : 'bell';
	const actionLabel = t(!following ? 'Not_Following' : 'Following');
	return <Box rcx-message pi='x20' pb='x16' pbs='x16' display='flex' {...props}>
		<Container mb='neg-x2'>
			<UserAvatar username={username} rcx-message__avatar size='x36'/>
		</Container>
		<Container width='1px' mb='neg-x4' flexGrow={1}>
			<Header>
				<Username>{username}</Username>
				<Timestamp ts={formatDate(ts)}/>
			</Header>
			<Body><RawText>{msg}</RawText></Body>
			<Box mi='neg-x8' flexDirection='row' display='flex' alignItems='baseline' mb='x8'>
				<Margins inline='x4'>
					<Box display='flex' alignItems='center' is='span' fontSize='x12' color='neutral-700' fontWeight='600' aria-label='1 reply'><Icon name='thread' size='x20'/> {replies} </Box>
					<Box display='flex' alignItems='center' is='span' fontSize='x12' color='neutral-700' fontWeight='600' aria-label='2 participants'><Icon name='user' size='x20'/> {participants} </Box>
					<Box display='flex' alignItems='center' is='span' fontSize='x12' color='neutral-700' fontWeight='600' aria-label='Last Message'><Icon name='clock' size='x20'/> {formatDate(tlm)} </Box>
				</Margins>
			</Box>
		</Container>
		<Container alignItems='center's>
			<Button data-following={following} data-id={_id} onClick={handleFollowButton} aria-label={actionLabel} small square ghost> <Icon name={button} size='x16'/> </Button>
			{
				(mention && <NotificationStatusMe mb='x24'/>)
				|| (all && <NotificationStatusAll mb='x24'/>)
				|| (unread && <NotificationStatusUnread mb='x24'/>)
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
	return <Box rcx-message__header display='flex' flexGrow={1} flexShrink={1} withTruncatedText><Box mi='neg-x2' display='flex' flexDirection='row' alignItems='baseline' withTruncatedText flexGrow={1	} flexShrink={1}><Margins inline='x2'> {children} </Margins></Box></Box>;
}

function Username(props) {
	return <Box rcx-message__username color='neutral-800' fontSize='x16' fontWeight='600' flexShrink={1} withTruncatedText {...props}/>;
}

function Timestamp({ ts }) {
	return <Box rcx-message__time fontSize='c1' color='neutral-600' flexShrink={0} withTruncatedText>{ts.toDateString ? ts.toDateString() : ts }</Box>;
}

const style = {
	display: '-webkit-box',
	overflow: 'hidden',
	WebkitLineClamp: 2,
	WebkitBoxOrient: 'vertical',
};

function Body(props) {
	return <Box rcx-message__body flexShrink={1} rcx-message__body style={style} height='34px' {...props}/>;
}
