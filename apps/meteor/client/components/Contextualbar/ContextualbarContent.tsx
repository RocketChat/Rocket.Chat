import { ContextualbarV2Content, ContextualbarContent as ContextualbarContentComponent } from '@rocket.chat/fuselage';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { forwardRef, memo } from 'react';

const ContextualbarContent = forwardRef<HTMLElement, ComponentProps<typeof ContextualbarContentComponent>>(
	function ContextualbarContent(props, ref) {
		return (
			<FeaturePreview feature='newNavigation'>
				<FeaturePreviewOff>
					<ContextualbarContentComponent ref={ref} {...props} />
				</FeaturePreviewOff>
				<FeaturePreviewOn>
					<ContextualbarV2Content ref={ref} {...props} />
				</FeaturePreviewOn>
			</FeaturePreview>
		);
	},
);

export default memo(ContextualbarContent);
