import type { ComponentPropsWithoutRef } from 'react';
import { memo } from 'react';

import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '../FeaturePreview';
import { HeaderV1 } from '../HeaderV1';
import { HeaderV2 } from '../HeaderV2';

const Header = (props: ComponentPropsWithoutRef<typeof HeaderV1>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderV1 {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2 {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(Header);
