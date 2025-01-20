import { ContextualbarV2EmptyContent, ContextualbarEmptyContent as ContextualbarEmptyContentComponent } from '@rocket.chat/fuselage';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { forwardRef, memo } from 'react';

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
