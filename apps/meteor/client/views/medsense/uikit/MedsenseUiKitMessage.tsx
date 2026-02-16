import { MessageBlock } from '@rocket.chat/fuselage';
import type { UiKitContext } from '@rocket.chat/fuselage-ui-kit';
import { UiKitComponent, UiKitContext as UiKitCtx } from '@rocket.chat/fuselage-ui-kit';
import type { MessageSurfaceLayout } from '@rocket.chat/ui-kit';
import type { ContextType } from 'react';

import { MedsenseUiKitMessageSurface } from './MedsenseFormSurfaceRenderer';
import MedsenseSmartInlineFormMessage, { canRenderMedsenseInlineSmartForm } from './MedsenseSmartInlineFormMessage';
import './medsenseUIKit.css';
import GazzodownText from '../../../components/GazzodownText';

type MedsenseUiKitMessageProps = {
	blocks: MessageSurfaceLayout;
	contextValue: ContextType<typeof UiKitContext>;
};

const MedsenseUiKitMessage = ({ blocks, contextValue }: MedsenseUiKitMessageProps) => (
	<MessageBlock fixedWidth>
		<UiKitCtx.Provider value={contextValue}>
			<GazzodownText>
				{canRenderMedsenseInlineSmartForm(blocks) ? (
					<MedsenseSmartInlineFormMessage blocks={blocks} />
				) : (
					<UiKitComponent render={MedsenseUiKitMessageSurface} blocks={blocks} />
				)}
			</GazzodownText>
		</UiKitCtx.Provider>
	</MessageBlock>
);

export default MedsenseUiKitMessage;
