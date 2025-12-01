import { ContextualbarV2EmptyContent, ContextualbarEmptyContent as ContextualbarEmptyContentComponent } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef, memo } from 'react';

import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '../FeaturePreview';

const ContextualbarEmptyContent = forwardRef<HTMLElement, ComponentProps<typeof ContextualbarEmptyContentComponent>>(
	function ContextualbarEmptyContent(props, ref) {
		return (
			<FeaturePreview feature='newNavigation'>
				<FeaturePreviewOff>
					<ContextualbarEmptyContentComponent ref={ref} {...props} />
				</FeaturePreviewOff>
				<FeaturePreviewOn>
					<ContextualbarV2EmptyContent ref={ref} {...props} />
				</FeaturePreviewOn>
			</FeaturePreview>
		);
	},
);

export default memo(ContextualbarEmptyContent);
