import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn, HeaderV2Subtitle, HeaderV1Subtitle } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const HeaderSubtitle = (props: ComponentProps<typeof HeaderV1Subtitle>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderV1Subtitle {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2Subtitle {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderSubtitle);
