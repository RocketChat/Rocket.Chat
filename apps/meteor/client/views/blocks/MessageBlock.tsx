import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';
import { UiKitMessage, UiKitComponent, kitContext, messageParser } from '@rocket.chat/fuselage-ui-kit';
import React, { ReactElement } from 'react';

import * as ActionManager from '../../../app/ui-message/client/ActionManager';
import { useBlockRendered } from '../../components/message/hooks/useBlockRendered';
import { renderMessageBody } from '../../lib/utils/renderMessageBody';
import './textParsers';

// TODO: move this to fuselage-ui-kit itself
const mrkdwn = ({ text }: { text?: string } | undefined = {}): ReactElement | null =>
	text ? <span dangerouslySetInnerHTML={{ __html: renderMessageBody({ msg: text }) }} /> : null;

messageParser.mrkdwn = mrkdwn;

const MessageBlock = ({ mid: _mid, rid, blocks, appId }: { mid: string; rid: string; blocks: any[]; appId: string }): ReactElement => {
	const { ref, className } = useBlockRendered<HTMLDivElement>();
	const context = {
		action: ({ actionId, value, blockId, mid = _mid }: { actionId: string; value: unknown; blockId: string; mid?: string }): void => {
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
		values: {},
		state: async (): Promise<void> => undefined,
	};

	return (
		<kitContext.Provider value={context}>
			<div className={className} ref={ref} />
			<UiKitComponent render={UiKitMessage} blocks={blocks} />
		</kitContext.Provider>
	);
};

export default MessageBlock;
