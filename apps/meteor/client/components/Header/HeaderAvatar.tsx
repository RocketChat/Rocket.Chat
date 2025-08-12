import {
	FeaturePreview,
	FeaturePreviewOff,
	FeaturePreviewOn,
	HeaderV2Avatar,
	HeaderAvatar as HeaderAvatarComponent,
} from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const HeaderAvatar = (props: ComponentProps<typeof HeaderAvatarComponent>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderAvatarComponent {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2Avatar {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderAvatar);
