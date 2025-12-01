import { ContextualbarV2, Contextualbar as ContextualbarComponent } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef, memo } from 'react';

import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '../FeaturePreview';

const Contextualbar = forwardRef<HTMLElement, ComponentProps<typeof ContextualbarComponent>>(function Contextualbar(props, ref) {
	return (
		<FeaturePreview feature='newNavigation'>
			<FeaturePreviewOff>
				<ContextualbarComponent ref={ref} {...props} />
			</FeaturePreviewOff>
			<FeaturePreviewOn>
				<ContextualbarV2 ref={ref} {...props} />
			</FeaturePreviewOn>
		</FeaturePreview>
	);
});

export default memo(Contextualbar);
