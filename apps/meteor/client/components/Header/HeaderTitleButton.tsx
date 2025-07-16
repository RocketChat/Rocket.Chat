import {
	FeaturePreview,
	FeaturePreviewOff,
	FeaturePreviewOn,
	HeaderV2TitleButton,
	HeaderTitleButton as HeaderTitleButtonComponent,
} from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const HeaderTitleButton = (props: ComponentProps<typeof HeaderTitleButtonComponent>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderTitleButtonComponent {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2TitleButton {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderTitleButton);
