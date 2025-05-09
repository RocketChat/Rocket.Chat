import {
	FeaturePreview,
	FeaturePreviewOff,
	FeaturePreviewOn,
	HeaderV2TagIcon,
	HeaderTagIcon as HeaderTagIconComponent,
} from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const HeaderTagIcon = (props: ComponentProps<typeof HeaderTagIconComponent>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderTagIconComponent {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2TagIcon {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderTagIcon);
