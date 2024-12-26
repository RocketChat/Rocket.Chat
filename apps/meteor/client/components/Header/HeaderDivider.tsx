import {
	FeaturePreview,
	FeaturePreviewOff,
	FeaturePreviewOn,
	HeaderV2Divider,
	HeaderDivider as HeaderDividerComponent,
} from '@rocket.chat/ui-client';
import { memo } from 'react';

const HeaderDivider = () => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderDividerComponent />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2Divider />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderDivider);
