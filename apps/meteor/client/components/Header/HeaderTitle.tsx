import {
	FeaturePreview,
	FeaturePreviewOff,
	FeaturePreviewOn,
	HeaderV2Title,
	HeaderTitle as HeaderTitleComponent,
} from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const HeaderTitle = (props: ComponentProps<typeof HeaderTitleComponent>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderTitleComponent {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2Title {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderTitle);
