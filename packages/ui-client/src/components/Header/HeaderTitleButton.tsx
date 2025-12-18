import type { ComponentPropsWithoutRef } from 'react';
import { memo } from 'react';

import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '../FeaturePreview';
import { HeaderV1TitleButton } from '../HeaderV1';
import { HeaderV2TitleButton } from '../HeaderV2';

const HeaderTitleButton = (props: ComponentPropsWithoutRef<typeof HeaderV1TitleButton>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderV1TitleButton {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2TitleButton {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderTitleButton);
