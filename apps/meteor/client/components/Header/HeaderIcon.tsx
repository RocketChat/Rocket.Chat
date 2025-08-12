import {
	FeaturePreview,
	FeaturePreviewOff,
	FeaturePreviewOn,
	HeaderV2Icon,
	HeaderIcon as HeaderIconComponent,
} from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const HeaderIcon = (props: ComponentProps<typeof HeaderIconComponent>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderIconComponent {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2Icon {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderIcon);
