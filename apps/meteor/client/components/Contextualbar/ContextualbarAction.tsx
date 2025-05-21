import { ContextualbarAction as ContextualbarActionComponent, ContextualbarV2Action } from '@rocket.chat/fuselage';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { forwardRef, memo } from 'react';

const ContextualbarAction = forwardRef<HTMLElement, ComponentProps<typeof ContextualbarActionComponent>>(
	function ContextualbarAction(props, ref) {
		return (
			<FeaturePreview feature='newNavigation'>
				<FeaturePreviewOff>
					<ContextualbarActionComponent {...props} ref={ref} />
				</FeaturePreviewOff>
				<FeaturePreviewOn>
					<ContextualbarV2Action {...props} ref={ref} />
				</FeaturePreviewOn>
			</FeaturePreview>
		);
	},
);

export default memo(ContextualbarAction);
