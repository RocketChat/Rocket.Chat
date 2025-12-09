import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn, HeaderV2Title, HeaderV1Title } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const HeaderTitle = (props: ComponentProps<typeof HeaderV1Title>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderV1Title {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2Title {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderTitle);
