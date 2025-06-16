import { ContextualbarV2Section, ContextualbarSection as ContextualbarSectionComponent } from '@rocket.chat/fuselage';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { forwardRef, memo } from 'react';

const ContextualbarSection = forwardRef<HTMLElement, ComponentProps<typeof ContextualbarSectionComponent>>(
	function ContextualbarSection(props, ref) {
		return (
			<FeaturePreview feature='newNavigation'>
				<FeaturePreviewOff>
					<ContextualbarSectionComponent ref={ref} {...props} />
				</FeaturePreviewOff>
				<FeaturePreviewOn>
					<ContextualbarV2Section ref={ref} {...props} />
				</FeaturePreviewOn>
			</FeaturePreview>
		);
	},
);

export default memo(ContextualbarSection);
