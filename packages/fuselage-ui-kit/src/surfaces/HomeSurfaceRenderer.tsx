import * as UiKit from '@rocket.chat/ui-kit';

import { FuselageSurfaceRenderer, renderTextObject } from './FuselageSurfaceRenderer';

export class HomeSurfaceRenderer extends FuselageSurfaceRenderer {
	public constructor() {
		super(UiKit.homeSurfaceLayoutBlockTypes);
	}

	override plain_text = renderTextObject;

	override mrkdwn = renderTextObject;
}
