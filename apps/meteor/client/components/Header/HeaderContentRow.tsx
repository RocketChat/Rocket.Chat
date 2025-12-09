import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn, HeaderV2ContentRow, HeaderV1ContentRow } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const HeaderContentRow = (props: ComponentProps<typeof HeaderV1ContentRow>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderV1ContentRow {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2ContentRow {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(HeaderContentRow);
