import { ContextualbarV2Icon, ContextualbarIcon as ContextualbarIconComponent } from '@rocket.chat/fuselage';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const ContextualbarIcon = (props: ComponentProps<typeof ContextualbarIconComponent>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<ContextualbarIconComponent {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<ContextualbarV2Icon {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(ContextualbarIcon);
