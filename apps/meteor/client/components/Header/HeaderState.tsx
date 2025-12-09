import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn, HeaderV2State, HeaderV1State } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const HeaderState = (props: ComponentProps<typeof HeaderV1State>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderV1State {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2State {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderState);
