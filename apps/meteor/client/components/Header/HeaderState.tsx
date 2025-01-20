import {
	FeaturePreview,
	FeaturePreviewOff,
	FeaturePreviewOn,
	HeaderV2State,
	HeaderState as HeaderStateComponent,
} from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const HeaderState = (props: ComponentProps<typeof HeaderStateComponent>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderStateComponent {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2State {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderState);
