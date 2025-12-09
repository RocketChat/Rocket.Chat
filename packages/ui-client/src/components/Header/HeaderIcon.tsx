import type { ComponentPropsWithoutRef } from 'react';
import { memo } from 'react';

import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '../FeaturePreview';
import { HeaderV1Icon } from '../HeaderV1';
import { HeaderV2Icon } from '../HeaderV2';

const HeaderIcon = (props: ComponentPropsWithoutRef<typeof HeaderV1Icon>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderV1Icon {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2Icon {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderIcon);
