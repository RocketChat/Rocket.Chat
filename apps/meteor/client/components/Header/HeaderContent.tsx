import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn, HeaderV2Content, HeaderV1Content } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const HeaderContent = (props: ComponentProps<typeof HeaderV1Content>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderV1Content {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2Content {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderContent);
