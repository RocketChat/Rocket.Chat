import type { ComponentPropsWithoutRef } from 'react';
import { memo } from 'react';

import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '../FeaturePreview';
import { HeaderV1State } from '../HeaderV1';
import { HeaderV2State } from '../HeaderV2';

const HeaderState = (props: ComponentPropsWithoutRef<typeof HeaderV1State>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderV1State {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2State {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderState);
