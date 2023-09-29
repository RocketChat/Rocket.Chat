import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { MessageBlock } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { UiKitComponent, UiKitMessage as UiKitMessageSurfaceRender, UiKitContext } from '@rocket.chat/fuselage-ui-kit';
import type { MessageSurfaceLayout } from '@rocket.chat/ui-kit';
import type { ContextType, ReactElement } from 'react';
import React, { useMemo } from 'react';

import {
	useVideoConfDispatchOutgoing,
	useVideoConfIsCalling,
	useVideoConfIsRinging,
	useVideoConfJoinCall,
	useVideoConfManager,
	useVideoConfSetPreferences,
} from '../../../contexts/VideoConfContext';
import { useUiKitActionManager } from '../../../hooks/useUiKitActionManager';
import { useVideoConfWarning } from '../../../views/room/contextualBar/VideoConference/hooks/useVideoConfWarning';
import GazzodownText from '../../GazzodownText';

type UiKitMessageBlockProps = {
	rid: IRoom['_id'];
	mid: IMessage['_id'];
	blocks: MessageSurfaceLayout;
};

const UiKitMessageBlock = ({ rid, mid, blocks }: UiKitMessageBlockProps): ReactElement => {
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

	// TODO: this structure is attrociously wrong; we should revisit this
	const contextValue = useMemo(
		(): ContextType<typeof UiKitContext> => ({
			action: ({ actionId, blockId, appId }, event) => {
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
					actionId,
					appId,
					container: {
						type: 'message',
						id: mid,
					},
					rid,
					mid,
				});
			},
			appId: '', // TODO: this is a hack
			rid,
			state: () => undefined, // TODO: this is a hack
			values: {}, // TODO: this is a hack
		}),
		[actionManager, handleOpenVideoConf, joinCall, mid, rid, setPreferences],
	);

	return (
		<MessageBlock fixedWidth>
			<UiKitContext.Provider value={contextValue}>
				<GazzodownText>
					<UiKitComponent render={UiKitMessageSurfaceRender} blocks={blocks} />
				</GazzodownText>
			</UiKitContext.Provider>
		</MessageBlock>
	);
};

export default UiKitMessageBlock;
