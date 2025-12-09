import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn, HeaderV2Divider, HeaderV1Divider } from '@rocket.chat/ui-client';
import { memo } from 'react';

const HeaderDivider = () => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderV1Divider />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2Divider />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderDivider);
