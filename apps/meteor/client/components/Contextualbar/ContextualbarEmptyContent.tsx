import { ContextualbarV2EmptyContent, ContextualbarEmptyContent as ContextualbarEmptyContentComponent } from '@rocket.chat/fuselage';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

const ContextualbarEmptyContent = (props: ComponentProps<typeof ContextualbarEmptyContentComponent>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<ContextualbarEmptyContentComponent {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<ContextualbarV2EmptyContent {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(ContextualbarEmptyContent);
