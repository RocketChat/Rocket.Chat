import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { MessageBlock } from '@rocket.chat/fuselage';
import { UiKitComponent, UiKitContext as UiKitCtx, UiKitMessage as UiKitMessageSurfaceRender } from '@rocket.chat/fuselage-ui-kit';
import type { MessageSurfaceLayout } from '@rocket.chat/ui-kit';
import { ErrorBoundary } from 'react-error-boundary';

import { useMessageBlockContextValue } from '../../../uikit/hooks/useMessageBlockContextValue';
import MedsenseUiKitMessage from '../../../views/medsense/uikit/MedsenseUiKitMessage';
import { isSmartFormsLayout } from '../../../views/medsense/uikit/isSmartFormsLayout';
import GazzodownText from '../../GazzodownText';

type UiKitMessageBlockProps = {
	rid: IRoom['_id'];
	mid: IMessage['_id'];
	blocks: MessageSurfaceLayout;
};

const UiKitMessageBlock = ({ rid, mid, blocks }: UiKitMessageBlockProps) => {
	const contextValue = useMessageBlockContextValue(rid, mid);
	const stock = (
		<MessageBlock fixedWidth>
			<UiKitCtx.Provider value={contextValue}>
				<GazzodownText>
					<UiKitComponent render={UiKitMessageSurfaceRender} blocks={blocks} />
				</GazzodownText>
			</UiKitCtx.Provider>
		</MessageBlock>
	);

	if (!isSmartFormsLayout(blocks)) {
		return stock;
	}

	return (
		<ErrorBoundary fallbackRender={() => stock}>
			<MedsenseUiKitMessage blocks={blocks} contextValue={contextValue} />
		</ErrorBoundary>
	);
};

export default UiKitMessageBlock;
