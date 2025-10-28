import { ContextualbarV2Title, ContextualbarTitle as ContextualbarTitleComponent } from '@rocket.chat/fuselage';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';

const ContextualbarTitle = (props: ComponentProps<typeof ContextualbarTitleComponent>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<ContextualbarTitleComponent id='contextualbarTitle' {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<ContextualbarV2Title id='contextualbarTitle' {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default ContextualbarTitle;
