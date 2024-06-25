import { ContextualbarV2Content, ContextualbarContent as ContextualbarContentComponent } from '@rocket.chat/fuselage';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

const ContextualbarContent = (props: ComponentProps<typeof ContextualbarContentComponent>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<ContextualbarContentComponent {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<ContextualbarV2Content {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(ContextualbarContent);
