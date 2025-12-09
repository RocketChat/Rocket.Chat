import type { ComponentPropsWithoutRef } from 'react';
import { memo } from 'react';

import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '../FeaturePreview';
import { HeaderV1ContentRow } from '../HeaderV1';
import { HeaderV2ContentRow } from '../HeaderV2';

const HeaderContentRow = (props: ComponentPropsWithoutRef<typeof HeaderV1ContentRow>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderV1ContentRow {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2ContentRow {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderContentRow);
