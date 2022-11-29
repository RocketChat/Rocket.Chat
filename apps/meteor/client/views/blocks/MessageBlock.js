import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { UiKitMessage, UiKitComponent, kitContext, messageParser } from '@rocket.chat/fuselage-ui-kit';
import React from 'react';

import * as ActionManager from '../../../app/ui-message/client/ActionManager';
import { useBlockRendered } from '../../components/message/hooks/useBlockRendered';
import {
	useVideoConfJoinCall,
	useVideoConfSetPreferences,
	useVideoConfIsCalling,
	useVideoConfIsRinging,
	useVideoConfDispatchOutgoing,
} from '../../contexts/VideoConfContext';
import { VideoConfManager } from '../../lib/VideoConfManager';
import { renderMessageBody } from '../../lib/utils/renderMessageBody';
import './textParsers';
import { useVideoConfWarning } from '../room/contextualBar/VideoConference/useVideoConfWarning';

// TODO: move this to fuselage-ui-kit itself
const mrkdwn = ({ text } = {}) => text && <span dangerouslySetInnerHTML={{ __html: renderMessageBody({ msg: text }) }} />;

messageParser.mrkdwn = mrkdwn;
function MessageBlock({ mid: _mid, rid, blocks, appId }) {
	const { ref, className } = useBlockRendered();
	const joinCall = useVideoConfJoinCall();
	const setPreferences = useVideoConfSetPreferences();
	const isCalling = useVideoConfIsCalling();
	const isRinging = useVideoConfIsRinging();
	const dispatchWarning = useVideoConfWarning();
	const dispatchPopup = useVideoConfDispatchOutgoing();

	const handleOpenVideoConf = useMutableCallback(async (rid) => {
		if (isCalling || isRinging) {
			return;
		}

		try {
			await VideoConfManager.loadCapabilities();
			dispatchPopup({ rid });
		} catch (error) {
			dispatchWarning(error.error);
		}
	});

	const context = {
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

			ActionManager.triggerBlockAction({
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
		appId,
		rid,
	};

	return (
		<kitContext.Provider value={context}>
			<div className={className} ref={ref} />
			<UiKitComponent render={UiKitMessage} blocks={blocks} />
		</kitContext.Provider>
	);
}

export default MessageBlock;
