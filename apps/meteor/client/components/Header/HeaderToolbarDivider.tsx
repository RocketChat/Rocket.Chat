import {
	FeaturePreview,
	FeaturePreviewOff,
	FeaturePreviewOn,
	HeaderV2ToolbarDivider,
	HeaderToolbarDivider as HeaderToolbarDividerComponent,
} from '@rocket.chat/ui-client';
import { memo } from 'react';

const HeaderToolbarDivider = () => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderToolbarDividerComponent />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2ToolbarDivider />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderToolbarDivider);
