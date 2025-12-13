import { memo } from 'react';

import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '../FeaturePreview';
import { HeaderV1Divider } from '../HeaderV1';
import { HeaderV2Divider } from '../HeaderV2';

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
