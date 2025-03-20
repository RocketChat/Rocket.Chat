import { ContextualbarV2Skeleton, ContextualbarSkeleton as ContextualbarSkeletonComponent } from '@rocket.chat/fuselage';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const ContextualbarSkeleton = (props: ComponentProps<typeof ContextualbarSkeletonComponent>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<ContextualbarSkeletonComponent {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<ContextualbarV2Skeleton {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(ContextualbarSkeleton);
