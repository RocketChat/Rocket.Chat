import type { ComponentPropsWithoutRef } from 'react';
import { memo } from 'react';

import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '../FeaturePreview';
import { HeaderV1TagIcon } from '../HeaderV1';
import { HeaderV2TagIcon } from '../HeaderV2';

const HeaderTagIcon = (props: ComponentPropsWithoutRef<typeof HeaderV1TagIcon>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderV1TagIcon {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2TagIcon {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderTagIcon);
