import { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { MessageFooterCallout } from '@rocket.chat/ui-composer';
import { useStream, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useEffect, useState } from 'react';

import { useOmnichannelRoom, useUserIsSubscribed } from '../../../../contexts/RoomContext';
import ComposerMessage, { ComposerMessageProps } from '../ComposerMessage';
import { ComposerOmnichannelInquiry } from './ComposerOmnichannelInquiry';
import { ComposerOmnichannelJoin } from './ComposerOmnichannelJoin';
import { ComposerOmnichannelOnHold } from './ComposerOmnichannelOnHold';

export const ComposerOmnichannel = (props: ComposerMessageProps): ReactElement => {
	const { queuedAt, servedBy, _id, open, onHold } = useOmnichannelRoom();

	const isSubscribed = useUserIsSubscribed();
	const [isInquired, setIsInquired] = useState(() => !servedBy && queuedAt);

	const subscribeToRoom = useStream('room-data');

	const t = useTranslation();

	useEffect(() => {
		subscribeToRoom(_id, (entry: IOmnichannelRoom) => {
			setIsInquired(!entry.servedBy && entry.queuedAt);
		});
	}, [_id, subscribeToRoom]);

	if (!open) {
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
