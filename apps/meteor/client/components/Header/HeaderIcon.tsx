import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn, HeaderV2Icon, HeaderV1Icon } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const HeaderIcon = (props: ComponentProps<typeof HeaderV1Icon>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderV1Icon {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2Icon {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderIcon);
