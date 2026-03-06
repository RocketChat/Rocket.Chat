import {
	UiKitModal as uiKitModal,
	UiKitBanner as uiKitBanner,
	UiKitMessage as uiKitMessage,
	UiKitContextualBar as uiKitContextualBar,
} from '@rocket.chat/fuselage-ui-kit';

import type { ILayoutBlock } from '../../Context/initialState';
import { SurfaceOptions } from '../Preview/Display/Surface/constant';

const RenderPayload = ({
	blocks,
	surface = SurfaceOptions.Message,
}: {
	index?: number;
	blocks: ILayoutBlock[];
	surface?: SurfaceOptions;
}) => {
	switch (surface) {
		case SurfaceOptions.Message:
			return uiKitMessage(blocks);

		case SurfaceOptions.Banner:
			return uiKitBanner(blocks);

		case SurfaceOptions.Modal:
			return uiKitModal(blocks);

		case SurfaceOptions.ContextualBar:
			return uiKitContextualBar(blocks);

		default:
			return null;
	}
};

export default RenderPayload;
