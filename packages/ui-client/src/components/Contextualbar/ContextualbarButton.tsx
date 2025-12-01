import { ContextualbarV2Button, ContextualbarButton as ContextualbarButtonComponent } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { memo } from 'react';

import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '../FeaturePreview';

const ContextualbarButton = (props: ComponentProps<typeof ContextualbarButtonComponent>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<ContextualbarButtonComponent {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<ContextualbarV2Button {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(ContextualbarButton);
