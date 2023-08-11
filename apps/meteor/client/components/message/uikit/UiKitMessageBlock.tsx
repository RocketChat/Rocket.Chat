import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { MessageBlock } from '@rocket.chat/fuselage';
import { UiKitComponent, UiKitMessage as UiKitMessageSurfaceRender, UiKitContext } from '@rocket.chat/fuselage-ui-kit';
import type { MessageSurfaceLayout } from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';
import React from 'react';

import { useMessageBlockContextValue } from '../../../UiKit/hooks/useMessageBlockContextValue';
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
	const contextValue = useMessageBlockContextValue(rid, _mid, appId);
	patchMessageParser(); // TODO: this is a hack

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
