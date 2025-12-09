import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn, HeaderV2Tag, HeaderV1Tag } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const HeaderTag = (props: ComponentProps<typeof HeaderV1Tag>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderV1Tag {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2Tag {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderTag);
