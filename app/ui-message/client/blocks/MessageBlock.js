import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';
import { UiKitMessage, UiKitComponent, kitContext, messageParser } from '@rocket.chat/fuselage-ui-kit';
import React, { useRef, useEffect } from 'react';

import RawText from '../../../../client/components/basic/RawText';
import { renderMessageBody } from '../../../ui-utils/client';
import * as ActionManager from '../ActionManager';

// TODO: move this to fuselage-ui-kit itself
messageParser.text = ({ text, type } = {}) => {
	if (type !== 'mrkdwn') {
		return text;
	}

	return <RawText>{renderMessageBody({ msg: text })}</RawText>;
};

export function MessageBlock({ mid: _mid, rid, blocks, appId }) {
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

	const ref = useRef();
	useEffect(() => {
		ref.current.dispatchEvent(new Event('rendered'));
	}, []);

	return (
		<kitContext.Provider value={context}>
			<div className='js-block-wrapper' ref={ref} />
			<UiKitComponent render={UiKitMessage} blocks={blocks} />
		</kitContext.Provider>
	);
}

export default MessageBlock;
