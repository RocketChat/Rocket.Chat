import type { ComponentPropsWithoutRef } from 'react';
import { memo } from 'react';

import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '../FeaturePreview';
import { HeaderV1Title } from '../HeaderV1';
import { HeaderV2Title } from '../HeaderV2';

const HeaderTitle = (props: ComponentPropsWithoutRef<typeof HeaderV1Title>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderV1Title {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2Title {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderTitle);
