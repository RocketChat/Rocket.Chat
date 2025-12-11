import { ContextualbarV2Footer, ContextualbarFooter as ContextualbarFooterComponent } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef, memo } from 'react';

import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '../FeaturePreview';

const ContextualbarFooter = forwardRef<HTMLElement, ComponentProps<typeof ContextualbarFooterComponent>>(
	function ContextualbarFooter(props, ref) {
		return (
			<FeaturePreview feature='newNavigation'>
				<FeaturePreviewOff>
					<ContextualbarFooterComponent ref={ref} {...props} />
				</FeaturePreviewOff>
				<FeaturePreviewOn>
					<ContextualbarV2Footer ref={ref} {...props} />
				</FeaturePreviewOn>
			</FeaturePreview>
		);
	},
);

export default memo(ContextualbarFooter);
