import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { MessageFooterCallout } from '@rocket.chat/ui-composer';
import { useStream, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect, useState } from 'react';

import { useOmnichannelRoom, useUserIsSubscribed } from '../../../../contexts/RoomContext';
import type { ComposerMessageProps } from '../ComposerMessage';
import ComposerMessage from '../ComposerMessage';
import { ComposerOmnichannelInquiry } from './ComposerOmnichannelInquiry';
import { ComposerOmnichannelJoin } from './ComposerOmnichannelJoin';
import { ComposerOmnichannelOnHold } from './ComposerOmnichannelOnHold';

const ComposerOmnichannel = (props: ComposerMessageProps): ReactElement => {
	const { queuedAt, servedBy, _id, open, onHold } = useOmnichannelRoom();

	const isSubscribed = useUserIsSubscribed();
	const [isInquired, setIsInquired] = useState(() => !servedBy && queuedAt);
	const [isOpen, setIsOpen] = useState(() => open);

	const subscribeToRoom = useStream('room-data');

	const t = useTranslation();

	useEffect(
		() =>
			subscribeToRoom(_id, (entry: IOmnichannelRoom) => {
				setIsInquired(!entry.servedBy && entry.queuedAt);
				setIsOpen(entry.open);
			}),
		[_id, subscribeToRoom],
	);

	useEffect(() => {
		setIsInquired(!servedBy && queuedAt);
	}, [queuedAt, servedBy, _id]);

	if (!isOpen) {
		return (
			<footer className='rc-message-box footer'>
				<MessageFooterCallout>{t('This_conversation_is_already_closed')}</MessageFooterCallout>
			</footer>
		);
	}

	if (onHold) {
		return <ComposerOmnichannelOnHold />;
	}

	if (isInquired) {
		return <ComposerOmnichannelInquiry />;
	}

	if (!isSubscribed) {
		return <ComposerOmnichannelJoin />;
	}

	return (
		<>
			<ComposerMessage {...props} />
		</>
	);
};

export default ComposerOmnichannel;
