import type { IRoom, IMessage } from '@rocket.chat/core-typings';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { UiKitContext } from '@rocket.chat/fuselage-ui-kit';
import { useCurrentRoutePath, useRoomToolbox } from '@rocket.chat/ui-contexts';
import {
	useVideoConfDispatchOutgoing,
	useVideoConfIsCalling,
	useVideoConfIsRinging,
	useVideoConfJoinCall,
	useVideoConfLoadCapabilities,
	useVideoConfSetPreferences,
	useVideoConfStartCall,
} from '@rocket.chat/ui-video-conf';
import type { ContextType } from 'react';

import { useUiKitActionManager } from './useUiKitActionManager';
import { useConferenceWindowEnabled } from '../../views/conference/hooks/useConferenceWindowEnabled';
import { useVideoConfWarning } from '../../views/room/contextualBar/VideoConference/hooks/useVideoConfWarning';

export const useMessageBlockContextValue = (rid: IRoom['_id'], mid: IMessage['_id']): ContextType<typeof UiKitContext> => {
	const joinCall = useVideoConfJoinCall();
	const setPreferences = useVideoConfSetPreferences();
	const isCalling = useVideoConfIsCalling();
	const isRinging = useVideoConfIsRinging();
	const dispatchWarning = useVideoConfWarning();
	const dispatchPopup = useVideoConfDispatchOutgoing();
	const loadVideoConfCapabilities = useVideoConfLoadCapabilities();
	const startCall = useVideoConfStartCall();
	const conferenceWindowEnabled = useConferenceWindowEnabled();
	const videoConfJoinDisabled = !!useCurrentRoutePath()?.startsWith('/conference/');

	const handleOpenVideoConf = useStableCallback(async (rid: IRoom['_id']) => {
		if (isCalling || isRinging) {
			return;
		}

		try {
			await loadVideoConfCapabilities();

			// Calling back from a message block is placing a call like any other: with the call window, that is the
			// preflight inside it, not the outgoing popup this used to raise. Left ungated, the popup the window is
			// meant to replace came back through this one path.
			if (conferenceWindowEnabled) {
				startCall(rid);
				return;
			}

			dispatchPopup({ rid });
		} catch (error: any) {
			dispatchWarning(error.error);
		}
	});

	const actionManager = useUiKitActionManager();

	const { openTab } = useRoomToolbox();

	return {
		action: ({ appId, actionId, blockId, value }, event) => {
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

			if (appId === 'media-call-core') {
				if (actionId === 'open-history') {
					return openTab('media-call-history', blockId);
				}
			}

			actionManager.emitInteraction(appId, {
				type: 'blockAction',
				actionId,
				payload: {
					blockId,
					value,
				},
				container: {
					type: 'message',
					id: mid,
				},
				rid,
				mid,
			});
		},
		rid,
		videoConfJoinDisabled,
		values: {}, // TODO: this is a hack to make the context work, but it should be removed
	};
};
