import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn, HeaderV2Tag, HeaderTag as HeaderTagComponent } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const HeaderTag = (props: ComponentProps<typeof HeaderTagComponent>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderTagComponent {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2Tag {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderTag);
