import { ContextualbarV2Header, ContextualbarHeader as ContextualbarHeaderComponent } from '@rocket.chat/fuselage';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

const ContextualbarHeader = (props: ComponentProps<typeof ContextualbarHeaderComponent>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<ContextualbarHeaderComponent {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<ContextualbarV2Header mbs={-1} {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(ContextualbarHeader);
