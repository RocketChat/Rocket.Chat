import { Button, Icon } from '@rocket.chat/fuselage';
import { FlowRouter } from 'meteor/kadira:flow-router';
import React, { memo } from 'react';

import Metrics from '../../../../components/Message/Metrics';
import Reply from '../../../../components/Message/Metrics/Reply';
import * as NotificationStatus from '../../../../components/Message/NotificationStatus';
import { followStyle, anchor } from '../../../../components/Message/helpers/followSyle';
import RawText from '../../../../components/RawText';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import * as MessageTemplate from '../../../room/components/MessageTemplate';

function isIterable(obj) {
	// checks for null and undefined
	if (obj == null) {
		return false;
	}
	return typeof obj[Symbol.iterator] === 'function';
}

export default memo(function Task({
	taskId,
	following,
	username,
	name = username,
	ts,
	replies,
	unread,
	mention,
	all,
	tcount,
	rid,
	title,
	status,
	setFollowing,
	handleTaskDetails,
	taskAssignee = [],
	t = (e) => e,
	formatDate = (e) => e,
	className = [],
	...props
}) {
	const button = !following ? 'bell-off' : 'bell';
	const actionLabel = t(!following ? 'Not_Following' : 'Following');

	const thread = (e) => {
		e.stopPropagation();
		FlowRouter.setParams({
			tab: 'thread',
			context: taskId,
		});
	};

	return (
		<MessageTemplate.Message
			{...props}
			className={[
				...(isIterable(className) ? className : [className]),
				!following && followStyle,
			].filter(Boolean)}
			style={{ heigth: '75px !important' }}
		>
			<MessageTemplate.Container mb='neg-x2'>
				<UserAvatar username={username} className='rcx-message__avatar' size='x28' />
			</MessageTemplate.Container>
			<MessageTemplate.Container width='1px' mb='neg-x4' flexGrow={1}>
				<MessageTemplate.Header>
					<MessageTemplate.Username title={username}>{name}</MessageTemplate.Username>
					<MessageTemplate.Timestamp ts={formatDate(ts)} />
				</MessageTemplate.Header>
				<MessageTemplate.BodyClamp>
					<RawText>{title}</RawText>
				</MessageTemplate.BodyClamp>
			</MessageTemplate.Container>
			<MessageTemplate.Container alignItems='center'>
				<Button
					className={anchor}
					small
					square
					flexShrink={0}
					ghost
					data-following={following}
					data-id={taskId}
					onClick={() => setFollowing(following, taskId)}
					title={actionLabel}
					aria-label={actionLabel}
				>
					<Icon name={button} size='x20' />
				</Button>
				{(mention && <NotificationStatus.Me t={t} mb='x24' />) ||
					(all && <NotificationStatus.All t={t} mb='x24' />) ||
					(unread && <NotificationStatus.Unread t={t} mb='x24' />)}
			</MessageTemplate.Container>
			<MessageTemplate.Container alignItems='center'>
				<Button
					className={anchor}
					small
					ghost
					data-id={taskId}
					onClick={handleTaskDetails}
					title={actionLabel}
					aria-label={actionLabel}
				>
					Details
				</Button>
			</MessageTemplate.Container>
			<Reply small ghost className={anchor} data-rid={rid} data-mid={taskId} onClick={thread}>
				{t('Reply')}
			</Reply>
			{taskAssignee && (
				<MessageTemplate.Container alignItems='center'>
					<Metrics.Item>
						<Metrics.Item.Icon name='user' />
						<Metrics.Item.Label>{`@${taskAssignee.join(', ')}`}</Metrics.Item.Label>
					</Metrics.Item>
				</MessageTemplate.Container>
			)}
			{tcount && (
				<MessageTemplate.Container alignItems='center'>
					<Metrics.Item>
						<Metrics.Item.Icon name='thread' />
						<Metrics.Item.Label>{tcount}</Metrics.Item.Label>
					</Metrics.Item>
				</MessageTemplate.Container>
			)}
			{status && (
				<MessageTemplate.Container alignItems='center'>
					<Metrics.Item>
						<Metrics.Item.Icon name='hash' />
						<Metrics.Item.Label>{status}</Metrics.Item.Label>
					</Metrics.Item>
				</MessageTemplate.Container>
			)}
		</MessageTemplate.Message>
	);
});
