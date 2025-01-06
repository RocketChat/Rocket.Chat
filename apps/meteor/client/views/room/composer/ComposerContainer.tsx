import { isOmnichannelRoom, isRoomFederated, isVoipRoom } from '@rocket.chat/core-typings';
import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { memo } from 'react';

import ComposerAirGappedRestricted from './ComposerAirGappedRestricted';
import ComposerAnonymous from './ComposerAnonymous';
import ComposerArchived from './ComposerArchived';
import ComposerBlocked from './ComposerBlocked';
import ComposerFederation from './ComposerFederation';
import ComposerJoinWithPassword from './ComposerJoinWithPassword';
import type { ComposerMessageProps } from './ComposerMessage';
import ComposerMessage from './ComposerMessage';
import ComposerOmnichannel from './ComposerOmnichannel';
import ComposerReadOnly from './ComposerReadOnly';
import ComposerSelectMessages from './ComposerSelectMessages';
import ComposerVoIP from './ComposerVoIP';
import { useRoom } from '../contexts/RoomContext';
import { useMessageComposerIsAnonymous } from './hooks/useMessageComposerIsAnonymous';
import { useMessageComposerIsArchived } from './hooks/useMessageComposerIsArchived';
import { useMessageComposerIsBlocked } from './hooks/useMessageComposerIsBlocked';
import { useMessageComposerIsReadOnly } from './hooks/useMessageComposerIsReadOnly';
import { useAirGappedRestriction } from '../../../hooks/useAirGappedRestriction';
import { useIsSelecting } from '../MessageList/contexts/SelectedMessagesContext';

const ComposerContainer = ({ children, ...props }: ComposerMessageProps): ReactElement => {
	const room = useRoom();

	const canJoinWithoutCode = usePermission('join-without-join-code');
	const mustJoinWithCode = !props.subscription && room.joinCodeRequired && !canJoinWithoutCode;

	const isAnonymous = useMessageComposerIsAnonymous();
	const isSelectingMessages = useIsSelecting();
	const isBlockedOrBlocker = useMessageComposerIsBlocked({ subscription: props.subscription });
	const isArchived = useMessageComposerIsArchived(room._id, props.subscription);
	const isReadOnly = useMessageComposerIsReadOnly(room._id);

	const isOmnichannel = isOmnichannelRoom(room);
	const isFederation = isRoomFederated(room);
	const isVoip = isVoipRoom(room);

	const [isAirGappedRestricted] = useAirGappedRestriction();

	if (isAirGappedRestricted) {
		return <ComposerAirGappedRestricted />;
	}

	if (isOmnichannel) {
		return <ComposerOmnichannel {...props} />;
	}

	if (isVoip) {
		return <ComposerVoIP />;
	}

	if (isFederation) {
		return <ComposerFederation {...props} />;
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

	if (isSelectingMessages) {
		return <ComposerSelectMessages {...props} />;
	}

	return (
		<>
			{children}
			<ComposerMessage {...props} />
		</>
	);
};

export default memo(ComposerContainer);
