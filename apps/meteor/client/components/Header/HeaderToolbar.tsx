import {
	FeaturePreview,
	FeaturePreviewOff,
	FeaturePreviewOn,
	HeaderV2Toolbar,
	HeaderToolbar as HeaderToolbarComponent,
} from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const HeaderToolbar = (props: ComponentProps<typeof HeaderToolbarComponent>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderToolbarComponent {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2Toolbar {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderToolbar);
