import {
	FeaturePreview,
	FeaturePreviewOff,
	FeaturePreviewOn,
	HeaderV2Content,
	HeaderContent as HeaderContentComponent,
} from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const HeaderContent = (props: ComponentProps<typeof HeaderContentComponent>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderContentComponent {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2Content {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderContent);
