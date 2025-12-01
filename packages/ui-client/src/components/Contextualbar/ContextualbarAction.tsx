import { ContextualbarAction as ContextualbarActionComponent, ContextualbarV2Action } from '@rocket.chat/fuselage';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '../FeaturePreview';
import type { ComponentProps } from 'react';
import { memo } from 'react';

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

