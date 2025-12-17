import type { ComponentPropsWithoutRef } from 'react';
import { memo } from 'react';

import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '../FeaturePreview';
import { HeaderV1Tag } from '../HeaderV1';
import { HeaderV2Tag } from '../HeaderV2';

const HeaderTag = (props: ComponentPropsWithoutRef<typeof HeaderV1Tag>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderV1Tag {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2Tag {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderTag);
