import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';
import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { MessageBlock } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { UiKitComponent, UiKitMessage, kitContext, messageParser } from '@rocket.chat/fuselage-ui-kit';
import type { MessageSurfaceLayout } from '@rocket.chat/ui-kit';
import type { ContextType, ReactElement } from 'react';
import React from 'react';

import * as ActionManager from '../../../../app/ui-message/client/ActionManager';
import {
	useVideoConfDispatchOutgoing,
	useVideoConfIsCalling,
	useVideoConfIsRinging,
	useVideoConfJoinCall,
	useVideoConfSetPreferences,
} from '../../../contexts/VideoConfContext';
import { VideoConfManager } from '../../../lib/VideoConfManager';
import { renderMessageBody } from '../../../lib/utils/renderMessageBody';
import { useVideoConfWarning } from '../../../views/room/contextualBar/VideoConference/useVideoConfWarning';
import { useBlockRendered } from '../hooks/useBlockRendered';

let patched = false;
const patchMessageParser = () => {
	if (patched) {
		return;
	}

	patched = true;

	// TODO: move this to fuselage-ui-kit itself
	messageParser.text = ({ text, type }) => {
		if (type !== 'mrkdwn') {
			return <>{text}</>;
		}

		return <span dangerouslySetInnerHTML={{ __html: renderMessageBody({ msg: text }) }} />;
	};

	// TODO: move this to fuselage-ui-kit itself
	messageParser.mrkdwn = ({ text }) => (text ? <span dangerouslySetInnerHTML={{ __html: renderMessageBody({ msg: text }) }} /> : null);
};

type UiKitSurfaceProps = {
	mid: IMessage['_id'];
	blocks: MessageSurfaceLayout;
	rid: IRoom['_id'];
	appId?: string | boolean; // TODO: this is a hack while the context value is not properly typed
};

const UiKitSurface = ({ mid: _mid, blocks, rid, appId }: UiKitSurfaceProps): ReactElement => {
	const { ref, className } = useBlockRendered<HTMLDivElement>();
	const joinCall = useVideoConfJoinCall();
	const setPreferences = useVideoConfSetPreferences();
	const isCalling = useVideoConfIsCalling();
	const isRinging = useVideoConfIsRinging();
	const dispatchWarning = useVideoConfWarning();
	const dispatchPopup = useVideoConfDispatchOutgoing();

	const handleOpenVideoConf = useMutableCallback(async (rid: IRoom['_id']) => {
		if (isCalling || isRinging) {
			return;
		}

		try {
			await VideoConfManager.loadCapabilities();
			dispatchPopup({ rid });
		} catch (error: any) {
			dispatchWarning(error.error);
		}
	});

	// TODO: this structure is attrociously wrong; we should revisit this
	const context: ContextType<typeof kitContext> = {
		// @ts-expect-error Property 'mid' does not exist on type 'ActionParams'.
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
		// @ts-expect-error Type 'string | boolean | undefined' is not assignable to type 'string'.
		appId,
		rid,
	};

	patchMessageParser(); // TODO: this is a hack

	return (
		<MessageBlock fixedWidth>
			<kitContext.Provider value={context}>
				<div className={className} ref={ref} />
				<UiKitComponent render={UiKitMessage} blocks={blocks} />
			</kitContext.Provider>
		</MessageBlock>
	);
};

export default UiKitSurface;
