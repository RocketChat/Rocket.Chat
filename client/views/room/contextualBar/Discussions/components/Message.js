import { Box, Icon } from '@rocket.chat/fuselage';
import React, { memo } from 'react';

import RawText from '../../../../../components/RawText';
import UserAvatar from '../../../../../components/avatar/UserAvatar';
import * as MessageTemplate from '../../../components/MessageTemplate';

export default memo(function Message({
	_id,
	msg,
	following,
	username,
	name = username,
	ts,
	dcount,
	t = (text) => text,
	participants,
	handleFollowButton,
	unread,
	mention,
	all,
	formatDate = (e) => e,
	dlm,
	className = [],
	...props
}) {
	return (
		<MessageTemplate.Message {...props} className={className}>
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
				<Box mi='neg-x2' flexDirection='row' display='flex' alignItems='baseline' mbs='x8'>
					{!dcount && (
						<Box display='flex' alignItems='center' is='span' fontSize='x12' color='neutral-700' fontWeight='600'>
							{t('No_messages_yet')}
						</Box>
					)}
					{!!dcount && (
						<Box display='flex' alignItems='center' is='span' fontSize='x12' color='neutral-700' fontWeight='600'>
							<Icon name='discussion' size='x20' mi='x2' />
							{dcount}
						</Box>
					)}
					{!!dcount && (
						<Box
							display='flex'
							alignItems='center'
							is='span'
							fontSize='x12'
							color='neutral-700'
							fontWeight='600'
							withTruncatedText
							flexShrink={1}
							mi='x2'
						>
							<Icon name='clock' size='x20' mi='x2' /> {formatDate(dlm)}{' '}
						</Box>
					)}
				</Box>
			</MessageTemplate.Container>
		</MessageTemplate.Message>
	);
});
