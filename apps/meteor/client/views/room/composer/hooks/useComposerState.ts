import type { ISubscription } from '@rocket.chat/core-typings';
import { isOmnichannelRoom, isRoomFederated, isRoomNativeFederated } from '@rocket.chat/core-typings';
import { usePermission } from '@rocket.chat/ui-contexts';

import { useMessageComposerIsAnonymous } from './useMessageComposerIsAnonymous';
import { useMessageComposerIsArchived } from './useMessageComposerIsArchived';
import { useMessageComposerIsBlocked } from './useMessageComposerIsBlocked';
import { useMessageComposerIsReadOnly } from './useMessageComposerIsReadOnly';
import { useAirGappedRestriction } from '../../../../hooks/useAirGappedRestriction';
import { useIsSelecting } from '../../MessageList/contexts/SelectedMessagesContext';
import { useRoom } from '../../contexts/RoomContext';
import type { ComposerState } from '../lib/composerState';
import { resolveComposerState } from '../lib/composerState';

/** Answers what the composer is for in this room right now, so a composer only has to draw it. */
export const useComposerState = (subscription?: ISubscription): ComposerState => {
	const room = useRoom();

	const canJoinWithoutCode = usePermission('join-without-join-code');
	const [isAirGappedRestricted] = useAirGappedRestriction();
	const isAnonymous = useMessageComposerIsAnonymous();
	const isReadOnly = useMessageComposerIsReadOnly(room);
	const isArchived = useMessageComposerIsArchived(room, subscription);
	const isBlockedOrBlocker = useMessageComposerIsBlocked({ subscription });
	const isSelectingMessages = useIsSelecting();

	return resolveComposerState({
		isAirGappedRestricted: Boolean(isAirGappedRestricted),
		isOmnichannel: isOmnichannelRoom(room),
		isFederation: isRoomFederated(room),
		isFederationBlocked: !isRoomNativeFederated(room),
		isAnonymous: Boolean(isAnonymous),
		isReadOnly: Boolean(isReadOnly),
		isArchived: Boolean(isArchived),
		mustJoinWithCode: !subscription && Boolean(room.joinCodeRequired) && !canJoinWithoutCode,
		isBlockedOrBlocker: Boolean(isBlockedOrBlocker),
		isSelectingMessages: Boolean(isSelectingMessages),
	});
};
