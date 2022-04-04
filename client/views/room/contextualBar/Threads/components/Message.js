import { Button, Icon } from '@rocket.chat/fuselage';
import React, { memo } from 'react';

import Metrics from '../../../../../components/Message/Metrics';
import * as NotificationStatus from '../../../../../components/Message/NotificationStatus';
import { followStyle, anchor } from '../../../../../components/Message/helpers/followSyle';
import RawText from '../../../../../components/RawText';
import UserAvatar from '../../../../../components/avatar/UserAvatar';
import * as MessageTemplate from '../../../components/MessageTemplate';

function isIterable(obj) {
	// checks for null and undefined
	if (obj == null) {
		return false;
	}
	return typeof obj[Symbol.iterator] === 'function';
}

export default memo(function Message({
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
		<MessageTemplate.Message
			{...props}
			className={[...(isIterable(className) ? className : [className]), !following && followStyle].filter(Boolean)}
		>
			<MessageTemplate.Container mb='neg-x2'>
				<UserAvatar username={username} className='rcx-message__avatar' size='x36' />
			</MessageTemplate.Container>
			<MessageTemplate.Container width='1px' mb='neg-x4' flexGrow={1}>
				<MessageTemplate.Header>
					<MessageTemplate.Username title={username}>{name}</MessageTemplate.Username>
					<MessageTemplate.Timestamp ts={formatDate(ts)} />
				</MessageTemplate.Header>
				<MessageTemplate.BodyClamp>
					<RawText>{msg}</RawText>
				</MessageTemplate.BodyClamp>
				<Metrics color='neutral-600' mi='neg-x8'>
					<Metrics.Item>
						<Metrics.Item.Icon name='thread' />
						<Metrics.Item.Label>{replies}</Metrics.Item.Label>
					</Metrics.Item>
					<Metrics.Item>
						<Metrics.Item.Icon name='user' />
						<Metrics.Item.Label>{participants}</Metrics.Item.Label>
					</Metrics.Item>
					<Metrics.Item>
						<Metrics.Item.Icon name='clock' />
						<Metrics.Item.Label>{formatDate(tlm)}</Metrics.Item.Label>
					</Metrics.Item>
				</Metrics>
			</MessageTemplate.Container>
			<MessageTemplate.Container alignItems='center'>
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
				{(mention && <NotificationStatus.Me t={t} mb='x24' />) ||
					(all && <NotificationStatus.All t={t} mb='x24' />) ||
					(unread && <NotificationStatus.Unread t={t} mb='x24' />)}
			</MessageTemplate.Container>
		</MessageTemplate.Message>
	);
});
