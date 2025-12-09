import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn, HeaderV2Avatar, HeaderV1Avatar } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const HeaderAvatar = (props: ComponentProps<typeof HeaderV1Avatar>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderV1Avatar {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2Avatar {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderAvatar);
