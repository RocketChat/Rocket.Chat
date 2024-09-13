import {
	FeaturePreview,
	FeaturePreviewOff,
	FeaturePreviewOn,
	HeaderV2ToolbarActionBadge,
	HeaderToolbarActionBadge as HeaderToolbarActionBadgeComponent,
} from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

const HeaderToolbarActionBadge = (props: ComponentProps<typeof HeaderToolbarActionBadgeComponent>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderToolbarActionBadgeComponent {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2ToolbarActionBadge {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderToolbarActionBadge);
