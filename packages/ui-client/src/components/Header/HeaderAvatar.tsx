import type { ComponentProps } from 'react';
import { memo } from 'react';

import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '../FeaturePreview';
import { HeaderV1Avatar } from '../HeaderV1';
import { HeaderV2Avatar } from '../HeaderV2';

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
