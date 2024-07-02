import {
	FeaturePreview,
	FeaturePreviewOff,
	FeaturePreviewOn,
	HeaderV2Divider,
	HeaderDivider as HeaderDividerComponent,
} from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

const HeaderDivider = (props: ComponentProps<typeof HeaderDividerComponent>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderDividerComponent {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2Divider {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderDivider);
