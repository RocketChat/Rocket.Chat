import { isOmnichannelRoom, isRoomFederated, isVoipRoom } from '@rocket.chat/core-typings';
import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import { useRoom } from '../contexts/RoomContext';
import ComposerAnonymous from './ComposerAnonymous';
import ComposerArchived from './ComposerArchived';
import ComposerBlocked from './ComposerBlocked';
import ComposerFederation from './ComposerFederation';
import ComposerJoinWithPassword from './ComposerJoinWithPassword';
import type { ComposerMessageProps } from './ComposerMessage';
import ComposerMessage from './ComposerMessage';
import ComposerOmnichannel from './ComposerOmnichannel';
import ComposerReadOnly from './ComposerReadOnly';
import ComposerVoIP from './ComposerVoIP';
import { useMessageComposerIsAnonymous } from './hooks/useMessageComposerIsAnonymous';
import { useMessageComposerIsArchived } from './hooks/useMessageComposerIsArchived';
import { useMessageComposerIsBlocked } from './hooks/useMessageComposerIsBlocked';
import { useMessageComposerIsReadOnly } from './hooks/useMessageComposerIsReadOnly';

const ComposerContainer = ({ children, ...props }: ComposerMessageProps): ReactElement => {
	const room = useRoom();
	const canJoinWithoutCode = usePermission('join-without-join-code');
	const mustJoinWithCode = !props.subscription && room.joinCodeRequired && !canJoinWithoutCode;

	const isAnonymous = useMessageComposerIsAnonymous();
	const isBlockedOrBlocker = useMessageComposerIsBlocked({ subscription: props.subscription });
	const isArchived = useMessageComposerIsArchived(room._id, props.subscription);
	const isReadOnly = useMessageComposerIsReadOnly(room._id);

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

	if (isReadOnly) {
		return <ComposerReadOnly />;
	}

	if (isArchived) {
		return <ComposerArchived />;
	}

	if (mustJoinWithCode) {
		return <ComposerJoinWithPassword />;
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
