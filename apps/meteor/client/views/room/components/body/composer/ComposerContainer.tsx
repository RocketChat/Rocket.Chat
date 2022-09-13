import { IRoom, ISubscription } from '@rocket.chat/core-typings';
import React, { memo, ReactElement } from 'react';

import { ChatMessages } from '../../../../../../app/ui';
import { useRoom } from '../../../contexts/RoomContext';
import { ComposerAnonymous } from './ComposerAnonymous';
import { ComposerBlocked } from './ComposerBlocked';
import { ComposerJoinWithPassword } from './ComposerJoinWithPassword';
import ComposerMessage from './ComposerMessage';
import { ComposerReadOnly } from './ComposerReadOnly';
import { useMessageComposerIsAnonymous } from './hooks/useMessageComposerIsAnonymous';
import { useMessageComposerIsBlocked } from './hooks/useMessageComposerIsBlocked';
import { useMessageComposerIsReadOnly } from './hooks/useMessageComposerIsReadOnly';

type ComposerContainerProps = {
	rid: IRoom['_id'];
	subscription?: ISubscription;
	chatMessagesInstance: ChatMessages;
	onResize?: () => void;
};

const ComposerContainer = ({ rid, subscription, chatMessagesInstance, onResize }: ComposerContainerProps): ReactElement => {
	const room = useRoom();

	const mustJoinWithCode = !subscription && room.joinCodeRequired;

	const isAnonymous = useMessageComposerIsAnonymous();

	const isBlockedOrBlocker = useMessageComposerIsBlocked({ subscription });

	const isReadOnly = useMessageComposerIsReadOnly(rid, subscription);

	if (isAnonymous) {
		return (
			<footer className='rc-message-box footer'>
				<ComposerAnonymous />
			</footer>
		);
	}

	if (mustJoinWithCode) {
		return (
			<footer className='rc-message-box footer'>
				<ComposerJoinWithPassword />
			</footer>
		);
	}

	if (isReadOnly) {
		return (
			<footer className='rc-message-box footer'>
				<ComposerReadOnly />
			</footer>
		);
	}

	if (isBlockedOrBlocker) {
		return (
			<footer className='rc-message-box footer'>
				<ComposerBlocked />
			</footer>
		);
	}

	return <ComposerMessage rid={rid} subscription={subscription} chatMessagesInstance={chatMessagesInstance} onResize={onResize} />;
};

export default memo(ComposerContainer);
