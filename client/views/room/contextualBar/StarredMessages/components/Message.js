import React, { memo } from 'react';

import { clickableItem } from '../../../helpers/clickableItem';
import UserAvatar from '../../../../../components/avatar/UserAvatar';
import RawText from '../../../../../components/RawText';
import * as MessageTemplate from '../../../components/Message';

function isIterable(obj) {
	// checks for null and undefined
	if (obj == null) {
		return false;
	}
	return typeof obj[Symbol.iterator] === 'function';
}

const Message = ({
	_id,
	msg,
	username,
	name = username,
	timestamp,
	formatDate = (e) => e,
	tlm,
	className = [],
	...props
}) => (
	<MessageTemplate.Message
		{...props}
		className={[...isIterable(className) ? className : [className]]}
	>
		<MessageTemplate.Container mb='neg-x2'>
			<UserAvatar username={username} className='rcx-message__avatar' size='x36'/>
		</MessageTemplate.Container>
		<MessageTemplate.Container width='1px' mb='neg-x4' flexGrow={1}>
			<MessageTemplate.Header>
				<MessageTemplate.Username title={username}>{name}</MessageTemplate.Username>
				<MessageTemplate.Timestamp ts={formatDate(timestamp)}/>
			</MessageTemplate.Header>
			<MessageTemplate.BodyClamp><RawText>{msg}</RawText></MessageTemplate.BodyClamp>
		</MessageTemplate.Container>
	</MessageTemplate.Message>
);

export default memo(clickableItem(Message));
