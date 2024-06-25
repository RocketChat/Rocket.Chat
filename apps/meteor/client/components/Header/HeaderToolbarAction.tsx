import {
	FeaturePreview,
	FeaturePreviewOff,
	FeaturePreviewOn,
	HeaderV2ToolbarAction,
	HeaderToolbarAction as HeaderToolbarActionComponent,
} from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

const HeaderToolbarAction = (props: ComponentProps<typeof HeaderToolbarActionComponent>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderToolbarActionComponent {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2ToolbarAction {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderToolbarAction);
