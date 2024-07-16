import {
	FeaturePreview,
	FeaturePreviewOff,
	FeaturePreviewOn,
	HeaderV2TagSkeleton,
	HeaderTagSkeleton as HeaderTagSkeletonComponent,
} from '@rocket.chat/ui-client';
import React, { memo } from 'react';

const HeaderTagSkeleton = () => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderTagSkeletonComponent />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2TagSkeleton />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderTagSkeleton);
