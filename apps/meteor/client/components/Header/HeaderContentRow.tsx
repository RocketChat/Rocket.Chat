import {
	FeaturePreview,
	FeaturePreviewOff,
	FeaturePreviewOn,
	HeaderV2ContentRow,
	HeaderContentRow as HeaderContentRowComponent,
} from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const HeaderContentRow = (props: ComponentProps<typeof HeaderContentRowComponent>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderContentRowComponent {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2ContentRow {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderContentRow);
