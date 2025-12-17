import type { ComponentPropsWithoutRef } from 'react';
import { memo } from 'react';

import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '../FeaturePreview';
import { HeaderV1ToolbarActionBadge } from '../HeaderV1';
import { HeaderV2ToolbarActionBadge } from '../HeaderV2';

const HeaderToolbarActionBadge = (props: ComponentPropsWithoutRef<typeof HeaderV1ToolbarActionBadge>) => (
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
