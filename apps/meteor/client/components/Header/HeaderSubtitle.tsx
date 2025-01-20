import {
	FeaturePreview,
	FeaturePreviewOff,
	FeaturePreviewOn,
	HeaderV2Subtitle,
	HeaderSubtitle as HeaderSubtitleComponent,
} from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const HeaderSubtitle = (props: ComponentProps<typeof HeaderSubtitleComponent>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderSubtitleComponent {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2Subtitle {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderSubtitle);
