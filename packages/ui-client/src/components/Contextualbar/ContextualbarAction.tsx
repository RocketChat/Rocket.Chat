import { ContextualbarAction as ContextualbarActionComponent, ContextualbarV2Action } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { memo } from 'react';

import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '../FeaturePreview';

const ContextualbarAction = (props: ComponentProps<typeof ContextualbarActionComponent>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<ContextualbarActionComponent {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<ContextualbarV2Action {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(ContextualbarAction);
