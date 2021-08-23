import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';
import {
	UiKitMessage,
	UiKitComponent,
	kitContext,
	messageParser,
} from '@rocket.chat/fuselage-ui-kit';
import React from 'react';

import * as ActionManager from '../../../app/ui-message/client/ActionManager';
import { useBlockRendered } from '../../components/Message/hooks/useBlockRendered';
import { renderMessageBody } from '../../lib/renderMessageBody';
import './textParsers';

// TODO: move this to fuselage-ui-kit itself
const mrkdwn = ({ text } = {}) =>
	text && <span dangerouslySetInnerHTML={{ __html: renderMessageBody({ msg: text }) }} />;

messageParser.mrkdwn = mrkdwn;
function MessageBlock({ mid: _mid, rid, blocks, appId }) {
	const { ref, className } = useBlockRendered();
	const context = {
		action: ({ actionId, value, blockId, mid = _mid }) => {
			ActionManager.triggerBlockAction({
				blockId,
				actionId,
				value,
				mid,
				rid,
				appId: blocks[0].appId,
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
