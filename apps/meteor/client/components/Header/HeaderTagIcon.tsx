import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn, HeaderV2TagIcon, HeaderV1TagIcon } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const HeaderTagIcon = (props: ComponentProps<typeof HeaderV1TagIcon>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderV1TagIcon {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2TagIcon {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderTagIcon);
