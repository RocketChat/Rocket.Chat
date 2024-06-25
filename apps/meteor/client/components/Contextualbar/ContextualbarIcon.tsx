import { ContextualbarV2Icon, ContextualbarIcon as ContextualbarFooterComponent } from '@rocket.chat/fuselage';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

const ContextualbarIcon = (props: ComponentProps<typeof ContextualbarFooterComponent>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<ContextualbarFooterComponent {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<ContextualbarV2Icon {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(ContextualbarIcon);
