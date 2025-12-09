import {
	FeaturePreview,
	FeaturePreviewOff,
	FeaturePreviewOn,
	HeaderV2ToolbarActionBadge,
	HeaderV1ToolbarActionBadge,
} from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const HeaderToolbarActionBadge = (props: ComponentProps<typeof HeaderV1ToolbarActionBadge>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderV1ToolbarActionBadge {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2ToolbarActionBadge {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderToolbarActionBadge);
