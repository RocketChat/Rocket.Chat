import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';
import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { MessageBlock } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { UiKitComponent, UiKitMessage as UiKitMessageSurfaceRender, UiKitContext } from '@rocket.chat/fuselage-ui-kit';
import type { MessageSurfaceLayout } from '@rocket.chat/ui-kit';
import type { ContextType, ReactElement } from 'react';
import React from 'react';

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

let patched = false;
const patchMessageParser = () => {
	if (patched) {
		return;
	}

	patched = true;
};

type UiKitMessageBlockProps = {
	mid: IMessage['_id'];
	blocks: MessageSurfaceLayout;
	rid: IRoom['_id'];
	appId?: string | boolean; // TODO: this is a hack while the context value is not properly typed
};

const UiKitMessageBlock = ({ mid: _mid, blocks, rid, appId }: UiKitMessageBlockProps): ReactElement => {
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
	const context: ContextType<typeof UiKitContext> = {
		// @ts-ignore Property 'mid' does not exist on type 'ActionParams'.
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
		// @ts-ignore Type 'string | boolean | undefined' is not assignable to type 'string'.
		appId,
		rid,
	};

	patchMessageParser(); // TODO: this is a hack

	return (
		<MessageBlock fixedWidth>
			<UiKitContext.Provider value={context}>
				<GazzodownText>
					<UiKitComponent render={UiKitMessageSurfaceRender} blocks={blocks} />
				</GazzodownText>
			</UiKitContext.Provider>
		</MessageBlock>
	);
};

export default UiKitMessageBlock;
