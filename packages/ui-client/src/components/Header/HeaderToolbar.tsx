import type { ComponentPropsWithoutRef } from 'react';
import { memo } from 'react';

import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '../FeaturePreview';
import { HeaderV1Toolbar } from '../HeaderV1';
import { HeaderV2Toolbar } from '../HeaderV2';

const HeaderToolbar = (props: ComponentPropsWithoutRef<typeof HeaderV1Toolbar>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderV1Toolbar {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2Toolbar {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderToolbar);
