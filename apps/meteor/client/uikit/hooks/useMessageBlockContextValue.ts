import type { IRoom, IMessage } from '@rocket.chat/core-typings';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { UiKitContext } from '@rocket.chat/fuselage-ui-kit';
import { useRoomToolbox, useRouter } from '@rocket.chat/ui-contexts';
import {
	useVideoConfDispatchOutgoing,
	useVideoConfIsCalling,
	useVideoConfIsRinging,
	useVideoConfJoinCall,
	useVideoConfLoadCapabilities,
	useVideoConfSetPreferences,
} from '@rocket.chat/ui-video-conf';
import { useCallback, useSyncExternalStore, type ContextType } from 'react';

import { useUiKitActionManager } from './useUiKitActionManager';
import { useVideoConfWarning } from '../../views/room/contextualBar/VideoConference/hooks/useVideoConfWarning';

export const useMessageBlockContextValue = (rid: IRoom['_id'], mid: IMessage['_id']): ContextType<typeof UiKitContext> => {
	const joinCall = useVideoConfJoinCall();
	const setPreferences = useVideoConfSetPreferences();
	const isCalling = useVideoConfIsCalling();
	const isRinging = useVideoConfIsRinging();
	const dispatchWarning = useVideoConfWarning();
	const dispatchPopup = useVideoConfDispatchOutgoing();
	const loadVideoConfCapabilities = useVideoConfLoadCapabilities();

	// The conference page renders a room's chat next to the call, so its message blocks can offer to join
	// *other* conferences. Disable those actions there — joining from inside a conference would replace
	// the call the user is already in.
	const router = useRouter();
	const routeName = useSyncExternalStore(
		router.subscribeToRouteChange,
		useCallback(() => router.getRouteName(), [router]),
	);
	const videoConfJoinDisabled = routeName === 'conference';

	const handleOpenVideoConf = useStableCallback(async (rid: IRoom['_id']) => {
		if (isCalling || isRinging) {
			return;
		}

		try {
			await loadVideoConfCapabilities();
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
				if (videoConfJoinDisabled && (actionId === 'join' || actionId === 'callBack')) {
					return undefined;
				}
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
