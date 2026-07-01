import { FuselageSurfaceRenderer, renderTextObject } from './FuselageSurfaceRenderer';

export class ModalSurfaceRenderer extends FuselageSurfaceRenderer {
	public constructor() {
		super(['actions', 'context', 'divider', 'header', 'image', 'input', 'section', 'preview', 'callout']);
	}

	override plain_text = renderTextObject;

	override mrkdwn = renderTextObject;
}
