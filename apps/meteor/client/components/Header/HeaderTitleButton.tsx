import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn, HeaderV2TitleButton, HeaderV1TitleButton } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const HeaderTitleButton = (props: ComponentProps<typeof HeaderV1TitleButton>) => (
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
