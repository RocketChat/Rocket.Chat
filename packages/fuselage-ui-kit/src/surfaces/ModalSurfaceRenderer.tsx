import * as UiKit from '@rocket.chat/ui-kit';

import { FuselageSurfaceRenderer, renderTextObject } from './FuselageSurfaceRenderer';

export class ModalSurfaceRenderer extends FuselageSurfaceRenderer {
	public constructor() {
		super(UiKit.modalSurfaceLayoutBlockTypes);
	}

	override plain_text = renderTextObject;

	override mrkdwn = renderTextObject;
}
