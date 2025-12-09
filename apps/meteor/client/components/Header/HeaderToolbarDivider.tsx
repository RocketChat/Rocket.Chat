import {
	FeaturePreview,
	FeaturePreviewOff,
	FeaturePreviewOn,
	HeaderV2ToolbarDivider,
	HeaderV1ToolbarDivider,
} from '@rocket.chat/ui-client';
import { memo } from 'react';

const HeaderToolbarDivider = () => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderV1ToolbarDivider />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2ToolbarDivider />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderToolbarDivider);
