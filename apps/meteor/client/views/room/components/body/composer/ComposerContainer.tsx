import { isOmnichannelRoom, isVoipRoom } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import { useRoom } from '../../../contexts/RoomContext';
import { ComposerAnonymous } from './ComposerAnonymous';
import { ComposerBlocked } from './ComposerBlocked';
import { ComposerJoinWithPassword } from './ComposerJoinWithPassword';
import type { ComposerMessageProps } from './ComposerMessage';
import ComposerMessage from './ComposerMessage';
import ComposerOmnichannel from './ComposerOmnichannel/ComposerOmnichannel';
import { ComposerReadOnly } from './ComposerReadOnly';
import ComposerVoIP from './ComposerVoIP';
import { useMessageComposerIsAnonymous } from './hooks/useMessageComposerIsAnonymous';
import { useMessageComposerIsBlocked } from './hooks/useMessageComposerIsBlocked';
import { useMessageComposerIsReadOnly } from './hooks/useMessageComposerIsReadOnly';

const ComposerContainer = (props: ComposerMessageProps): ReactElement => {
	const room = useRoom();

	const mustJoinWithCode = !props.subscription && room.joinCodeRequired;

	const isAnonymous = useMessageComposerIsAnonymous();

	const isBlockedOrBlocker = useMessageComposerIsBlocked({ subscription: props.subscription });

	const isReadOnly = useMessageComposerIsReadOnly(props.rid, props.subscription);

	const isOmnichannel = isOmnichannelRoom(room);

	const isVoip = isVoipRoom(room);

	if (isOmnichannel) {
		return <ComposerOmnichannel {...props} />;
	}

	if (isVoip) {
		return <ComposerVoIP />;
	}

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

	return <ComposerMessage {...props} />;
};

export default memo(ComposerContainer);
