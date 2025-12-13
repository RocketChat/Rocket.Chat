import { memo } from 'react';

import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '../FeaturePreview';
import { HeaderV1TagSkeleton } from '../HeaderV1';
import { HeaderV2TagSkeleton } from '../HeaderV2';

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
