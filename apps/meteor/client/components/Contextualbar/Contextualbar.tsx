import { ContextualbarV2, Contextualbar as ContextualbarComponent } from '@rocket.chat/fuselage';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

const Contextualbar = (props: ComponentProps<typeof ContextualbarComponent>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<ContextualbarComponent {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<ContextualbarV2 {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(Contextualbar);
