import React, { memo } from 'react';
import { Button, Icon } from '@rocket.chat/fuselage';

import { clickableItem } from '../../../helpers/clickableItem';
import UserAvatar from '../../../../../components/avatar/UserAvatar';
import RawText from '../../../../../components/RawText';
import * as MessageTemplate from '../../../components/Message';
import { useUnstarMessage } from '../hooks/useStarredMessages';

const isIterable = (obj) => {
	// checks for null and undefined
	if (obj == null) {
		return false;
	}
	return typeof obj[Symbol.iterator] === 'function';
};

const Message = ({
	_id,
	msg,
	username,
	name = username,
	timestamp,
	formatDate = (e) => e,
	className = [],
	t,
	dispatchToastMessage,
	getPermaLink,
	...props
}) => {
	const unstarMessage = useUnstarMessage();

	const handleGetLinkButton = async (e) => {
		e.stopPropagation();

		const permalink = await getPermaLink(_id);

		navigator.clipboard.writeText(permalink);

		dispatchToastMessage({
			type: 'success',
			message: t('Copied'),
		});
	};

	const handleUnstarButton = (e) => {
		e.stopPropagation();

		unstarMessage(_id);
	};

	return <MessageTemplate.Message
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
		<MessageTemplate.Container alignItems='center'>
			<Button
				small
				square
				flexShrink={0}
				ghost
				onClick={handleUnstarButton}
				title={t('Unstar_Message')}
			>
				<Icon name={'star'} size='x20'/>
			</Button>
			<Button
				small
				square
				flexShrink={0}
				ghost
				onClick={handleGetLinkButton}
				title={t('Get_link')}
			>
				<Icon name={'link'} size='x20'/>
			</Button>
		</MessageTemplate.Container>
	</MessageTemplate.Message>;
};

export default memo(clickableItem(Message));
