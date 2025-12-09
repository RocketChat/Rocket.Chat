import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn, HeaderV2Toolbar, HeaderV1Toolbar } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const HeaderToolbar = (props: ComponentProps<typeof HeaderV1Toolbar>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderV1Toolbar {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2Toolbar {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderToolbar);
