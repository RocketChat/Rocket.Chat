import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';
import type { IRoom } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { UiKitContext } from '@rocket.chat/fuselage-ui-kit';
import type { ContextType } from 'react';

import {
	useVideoConfDispatchOutgoing,
	useVideoConfIsCalling,
	useVideoConfIsRinging,
	useVideoConfJoinCall,
	useVideoConfManager,
	useVideoConfSetPreferences,
} from '../../contexts/VideoConfContext';
import { useUiKitActionManager } from '../../hooks/useUiKitActionManager';
import { useVideoConfWarning } from '../../views/room/contextualBar/VideoConference/hooks/useVideoConfWarning';

export const useMessageBlockContextValue = (
	rid: IRoom['_id'],
	_mid: IMessage['id'],
	appId?: string | boolean,
): ContextType<typeof UiKitContext> => {
	const joinCall = useVideoConfJoinCall();
	const setPreferences = useVideoConfSetPreferences();
	const isCalling = useVideoConfIsCalling();
	const isRinging = useVideoConfIsRinging();
	const dispatchWarning = useVideoConfWarning();
	const dispatchPopup = useVideoConfDispatchOutgoing();

	const videoConfManager = useVideoConfManager();

	const handleOpenVideoConf = useMutableCallback(async (rid: IRoom['_id']) => {
		if (isCalling || isRinging) {
			return;
		}

		try {
			await videoConfManager?.loadCapabilities();
			dispatchPopup({ rid });
		} catch (error: any) {
			dispatchWarning(error.error);
		}
	});

	const actionManager = useUiKitActionManager();

	return {
		action: ({ actionId, value, blockId, mid = _mid, appId }, event) => {
			if (appId === 'videoconf-core') {
				event.preventDefault();
				setPreferences({ mic: true, cam: false });
				if (actionId === 'join') {
					return joinCall(blockId);
				}

				if (actionId === 'callBack') {
					return handleOpenVideoConf(blockId);
				}
			}

			actionManager?.triggerBlockAction({
				blockId,
				actionId,
				value,
				mid,
				rid,
				appId,
				container: {
					type: UIKitIncomingInteractionContainerType.MESSAGE,
					id: mid,
				},
			});
		},
		state: {
			appId,
			rid,
		},
	};
};
