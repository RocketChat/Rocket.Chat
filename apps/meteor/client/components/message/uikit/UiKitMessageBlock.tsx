import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { MessageBlock, Skeleton } from '@rocket.chat/fuselage';
import { UiKitComponent, UiKitMessage as UiKitMessageSurfaceRender, UiKitContext } from '@rocket.chat/fuselage-ui-kit';
import type { MessageSurfaceLayout } from '@rocket.chat/ui-kit';
import React, { Suspense } from 'react';

import { useMessageBlockContextValue } from '../../../uikit/hooks/useMessageBlockContextValue';
import GazzodownText from '../../GazzodownText';

type UiKitMessageBlockProps = {
	rid: IRoom['_id'];
	mid: IMessage['_id'];
	blocks: MessageSurfaceLayout;
};

const UiKitMessageBlock = ({ rid, mid, blocks }: UiKitMessageBlockProps) => {
	const contextValue = useMessageBlockContextValue(rid, mid);

	return (
		<MessageBlock fixedWidth>
			<UiKitContext.Provider value={contextValue}>
				<GazzodownText>
					<Suspense fallback={<Skeleton />}>
						<UiKitComponent render={UiKitMessageSurfaceRender} blocks={blocks} />
					</Suspense>
				</GazzodownText>
			</UiKitContext.Provider>
		</MessageBlock>
	);
};

export default UiKitMessageBlock;
