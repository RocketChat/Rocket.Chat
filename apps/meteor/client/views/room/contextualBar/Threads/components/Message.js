import { Button, Icon, Message, Box } from '@rocket.chat/fuselage';
import React from 'react';

import * as NotificationStatus from '../../../../../components/Message/NotificationStatus';
import { followStyle, anchor } from '../../../../../components/Message/helpers/followSyle';
import RawText from '../../../../../components/RawText';
import UserAvatar from '../../../../../components/avatar/UserAvatar';

function isIterable(obj) {
	// checks for null and undefined
	if (obj == null) {
		return false;
	}
	return typeof obj[Symbol.iterator] === 'function';
}

export default React.memo(function MessageThread({
	_id,
	msg,
	following,
	username,
	name = username,
	ts,
	replies,
	participants,
	handleFollowButton,
	unread,
	mention,
	all,
	t = (e) => e,
	formatDate = (e) => e,
	tlm,
	className = [],
	...props
}) {
	const button = !following ? 'bell-off' : 'bell';
	const actionLabel = t(!following ? 'Not_Following' : 'Following');
	return (
		<Box className={className} pb='x8'>
			<Message {...props} className={[...(isIterable(className) ? className : [className]), !following && followStyle].filter(Boolean)}>
				<Message.LeftContainer>
					<UserAvatar username={username} className='rcx-message__avatar' size='x36' />
				</Message.LeftContainer>
				<Message.Container>
					<Message.Header>
						<Message.Name title={username}>{name}</Message.Name>
						<Message.Timestamp>{formatDate(ts)}</Message.Timestamp>
					</Message.Header>
					<Message.Body clamp={2}>
						<RawText>{msg}</RawText>
					</Message.Body>
					<Message.Block>
						<Message.Metrics>
							<Message.Metrics.Item>
								<Message.Metrics.Item.Icon name='thread' />
								<Message.Metrics.Item.Label>{replies}</Message.Metrics.Item.Label>
							</Message.Metrics.Item>
							<Message.Metrics.Item>
								<Message.Metrics.Item.Icon name='user' />
								<Message.Metrics.Item.Label>{participants}</Message.Metrics.Item.Label>
							</Message.Metrics.Item>
							<Message.Metrics.Item>
								<Message.Metrics.Item.Icon name='clock' />
								<Message.Metrics.Item.Label>{formatDate(tlm)}</Message.Metrics.Item.Label>
							</Message.Metrics.Item>
						</Message.Metrics>
					</Message.Block>
				</Message.Container>
				<Message.ContainerFixed>
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
				</Message.ContainerFixed>
			</Message>
		</Box>
	);
});
