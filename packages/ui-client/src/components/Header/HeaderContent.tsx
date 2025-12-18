import type { ComponentPropsWithoutRef } from 'react';
import { memo } from 'react';

import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '../FeaturePreview';
import { HeaderV1Content } from '../HeaderV1';
import { HeaderV2Content } from '../HeaderV2';

const HeaderContent = (props: ComponentPropsWithoutRef<typeof HeaderV1Content>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderV1Content {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2Content {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderContent);
