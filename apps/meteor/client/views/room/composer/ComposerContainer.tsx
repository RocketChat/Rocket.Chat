import { isOmnichannelRoom, isRoomFederated, isVoipRoom } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import { useRoom } from '../contexts/RoomContext';
import ComposerAnonymous from './ComposerAnonymous';
import ComposerBlocked from './ComposerBlocked';
import ComposerFederation from './ComposerFederation';
import ComposerJoinWithPassword from './ComposerJoinWithPassword';
import type { ComposerMessageProps } from './ComposerMessage';
import ComposerMessage from './ComposerMessage';
import ComposerOmnichannel from './ComposerOmnichannel';
import ComposerReadOnly from './ComposerReadOnly';
import ComposerVoIP from './ComposerVoIP';
import { useMessageComposerIsAnonymous } from './hooks/useMessageComposerIsAnonymous';
import { useMessageComposerIsBlocked } from './hooks/useMessageComposerIsBlocked';
import { useMessageComposerIsReadOnly } from './hooks/useMessageComposerIsReadOnly';

const ComposerContainer = ({ children, ...props }: ComposerMessageProps): ReactElement => {
	const room = useRoom();

	const mustJoinWithCode = !props.subscription && room.joinCodeRequired;

	const isAnonymous = useMessageComposerIsAnonymous();

	const isBlockedOrBlocker = useMessageComposerIsBlocked({ subscription: props.subscription });

	const isReadOnly = useMessageComposerIsReadOnly(props.rid, props.subscription);

	const isOmnichannel = isOmnichannelRoom(room);

	const isFederation = isRoomFederated(room);

	const isVoip = isVoipRoom(room);

	if (isOmnichannel) {
		return <ComposerOmnichannel {...props} />;
	}

	if (isVoip) {
		return <ComposerVoIP />;
	}

	if (isFederation) {
		return <ComposerFederation room={room} {...props} />;
	}

	if (isAnonymous) {
		return <ComposerAnonymous />;
	}

	if (mustJoinWithCode) {
		return <ComposerJoinWithPassword />;
	}

	if (isReadOnly) {
		return <ComposerReadOnly />;
	}

	if (isBlockedOrBlocker) {
		return <ComposerBlocked />;
	}

	return (
		<>
			{children}
			<ComposerMessage readOnly={room.ro} {...props} />
		</>
	);
};

export default memo(ComposerContainer);
