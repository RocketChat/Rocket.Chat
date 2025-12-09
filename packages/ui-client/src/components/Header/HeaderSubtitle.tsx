import type { ComponentPropsWithoutRef } from 'react';
import { memo } from 'react';

import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '../FeaturePreview';
import { HeaderV1Subtitle } from '../HeaderV1';
import { HeaderV2Subtitle } from '../HeaderV2';

const HeaderSubtitle = (props: ComponentPropsWithoutRef<typeof HeaderV1Subtitle>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderV1Subtitle {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2Subtitle {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderSubtitle);
