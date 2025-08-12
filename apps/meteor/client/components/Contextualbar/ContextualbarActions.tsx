import { ContextualbarV2Actions, ContextualbarActions as ContextualbarActionsComponent } from '@rocket.chat/fuselage';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const ContextualbarActions = (props: ComponentProps<typeof ContextualbarActionsComponent>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<ContextualbarActionsComponent {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<ContextualbarV2Actions {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(ContextualbarActions);
