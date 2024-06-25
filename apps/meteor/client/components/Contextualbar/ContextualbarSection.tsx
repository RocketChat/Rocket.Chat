import { ContextualbarV2Section, ContextualbarSection as ContextualbarSectionComponent } from '@rocket.chat/fuselage';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

const ContextualbarSection = (props: ComponentProps<typeof ContextualbarSectionComponent>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<ContextualbarSectionComponent {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<ContextualbarV2Section {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(ContextualbarSection);
