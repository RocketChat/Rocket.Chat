import {
	UiKitModal as uiKitModal,
	UiKitBanner as uiKitBanner,
	UiKitMessage as uiKitMessage,
	UiKitContextualBar as uiKitContextualBar,
} from '@rocket.chat/fuselage-ui-kit';
import type { LayoutBlock } from '@rocket.chat/ui-kit';

const RenderPayload = ({ payload, surface = 1 }: { index?: number; payload: readonly LayoutBlock[]; surface?: number }) => {
	const uiKitRender: { [key: number]: any } = {
		'1': () => uiKitMessage(payload),
		'2': () => uiKitBanner(payload),
		'3': () => uiKitModal(payload),
		'4': () => uiKitContextualBar(payload),
	};
	return <>{uiKitRender[surface]()}</>;
};

export default RenderPayload;
