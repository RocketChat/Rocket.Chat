import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn, HeaderV2TagSkeleton, HeaderV1TagSkeleton } from '@rocket.chat/ui-client';
import { memo } from 'react';

const HeaderTagSkeleton = () => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderV1TagSkeleton />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2TagSkeleton />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderTagSkeleton);
