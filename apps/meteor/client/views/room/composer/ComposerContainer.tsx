import { isOmnichannelRoom, isRoomFederated, isRoomNativeFederated } from '@rocket.chat/core-typings';
import { usePermission } from '@rocket.chat/ui-contexts';
import { memo } from 'react';

import ComposerAbacLocked from './ComposerAbacLocked';
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
import { useRoom } from '../contexts/RoomContext';
import { useMessageComposerIsAnonymous } from './hooks/useMessageComposerIsAnonymous';
import { useMessageComposerIsArchived } from './hooks/useMessageComposerIsArchived';
import { useMessageComposerIsBlocked } from './hooks/useMessageComposerIsBlocked';
import { useMessageComposerIsReadOnly } from './hooks/useMessageComposerIsReadOnly';
import { useAirGappedRestriction } from '../../../hooks/useAirGappedRestriction';
import { useIsRoomLocked } from '../../admin/ABAC/hooks/useIsRoomLocked';
import { useIsSelecting } from '../MessageList/contexts/SelectedMessagesContext';

const ComposerContainer = ({ children, ...props }: ComposerMessageProps) => {
	const room = useRoom();

	const canJoinWithoutCode = usePermission('join-without-join-code');
	const mustJoinWithCode = !props.subscription && room.joinCodeRequired && !canJoinWithoutCode;

	const isAnonymous = useMessageComposerIsAnonymous();
	const isSelectingMessages = useIsSelecting();
	const isBlockedOrBlocker = useMessageComposerIsBlocked({ subscription: props.subscription });
	const isArchived = useMessageComposerIsArchived(room, props.subscription);
	const isReadOnly = useMessageComposerIsReadOnly(room);
	const isAbacLocked = useIsRoomLocked(room);

	const isOmnichannel = isOmnichannelRoom(room);
	const isFederation = isRoomFederated(room);

	const isFederationBlocked = !isRoomNativeFederated(room);

	const [isAirGappedRestricted] = useAirGappedRestriction();

	if (isAirGappedRestricted) {
		return <ComposerAirGappedRestricted />;
	}

	if (isOmnichannel) {
		return <ComposerOmnichannel {...props} />;
	}

	if (isFederation) {
		return <ComposerFederation blocked={isFederationBlocked} {...props} />;
	}

	if (isAnonymous) {
		return <ComposerAnonymous />;
	}

	// ABAC-P4 §7.3 — locked is a distinct state from read-only and a room can be both. It is
	// resolved first because its callout is the one carrying the way out of the state. Omnichannel
	// and federated rooms have already returned above, which is what keeps them excluded (D8) by
	// structure rather than by a condition someone has to remember.
	if (isAbacLocked) {
		return <ComposerAbacLocked />;
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
