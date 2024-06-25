import {
	FeaturePreview,
	FeaturePreviewOff,
	FeaturePreviewOn,
	HeaderV2TagSkeleton,
	HeaderTagSkeleton as HeaderTagSkeletonComponent,
} from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

const HeaderTagSkeleton = (props: ComponentProps<typeof HeaderTagSkeletonComponent>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderTagSkeletonComponent {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2TagSkeleton {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderTagSkeleton);
