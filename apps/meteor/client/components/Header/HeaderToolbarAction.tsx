import {
	FeaturePreview,
	FeaturePreviewOff,
	FeaturePreviewOn,
	HeaderV2ToolbarAction,
	HeaderToolbarAction as HeaderToolbarActionComponent,
} from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { forwardRef, memo } from 'react';

const HeaderToolbarAction = forwardRef<HTMLButtonElement, ComponentProps<typeof HeaderToolbarActionComponent>>(
	function HeaderToolbarAction(props, ref) {
		return (
			<FeaturePreview feature='newNavigation'>
				<FeaturePreviewOff>
					<HeaderToolbarActionComponent ref={ref} {...props} />
				</FeaturePreviewOff>
				<FeaturePreviewOn>
					<HeaderV2ToolbarAction ref={ref} {...props} />
				</FeaturePreviewOn>
			</FeaturePreview>
		);
	},
);

export default memo(HeaderToolbarAction);
