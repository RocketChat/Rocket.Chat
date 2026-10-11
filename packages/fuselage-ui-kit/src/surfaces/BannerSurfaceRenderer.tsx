import * as UiKit from '@rocket.chat/ui-kit';

import { FuselageSurfaceRenderer, renderTextObject } from './FuselageSurfaceRenderer';

export class BannerSurfaceRenderer extends FuselageSurfaceRenderer {
	public constructor() {
		super(UiKit.bannerSurfaceLayoutBlockTypes);
	}

	override plain_text = renderTextObject;

	override mrkdwn = renderTextObject;
}
