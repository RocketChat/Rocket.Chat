import { memo } from 'react';

import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '../FeaturePreview';
import { HeaderV1ToolbarDivider } from '../HeaderV1';
import { HeaderV2ToolbarDivider } from '../HeaderV2';

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
