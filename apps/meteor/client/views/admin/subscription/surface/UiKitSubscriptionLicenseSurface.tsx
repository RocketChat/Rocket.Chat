import { Margins } from '@rocket.chat/fuselage';
import { createSurfaceRenderer, Surface, FuselageSurfaceRenderer, renderTextObject } from '@rocket.chat/fuselage-ui-kit';
import type { CalloutBlock, ContextBlock, DividerBlock, ImageBlock, SectionBlock } from '@rocket.chat/ui-kit';
import type { ReactElement, ReactNode } from 'react';

type SubscriptionLicenseSurfaceProps = {
	children?: ReactNode;
};

type SubscriptionLicenseLayoutBlock = ContextBlock | DividerBlock | ImageBlock | SectionBlock | CalloutBlock;

export type SubscriptionLicenseLayout = SubscriptionLicenseLayoutBlock[];

const SubscriptionLicenseSurface = ({ children }: SubscriptionLicenseSurfaceProps): ReactElement => (
	<Surface type='custom'>
		<Margins blockEnd={16}>{children}</Margins>
	</Surface>
);

export class SubscriptionLicenseSurfaceRenderer extends FuselageSurfaceRenderer {
	public constructor() {
		super(['context', 'divider', 'image', 'section', 'callout']);
	}

	plain_text = renderTextObject;

	mrkdwn = renderTextObject;
}

export default SubscriptionLicenseSurface;

export const UiKitSubscriptionLicenseSurface = createSurfaceRenderer(SubscriptionLicenseSurface, new SubscriptionLicenseSurfaceRenderer());
