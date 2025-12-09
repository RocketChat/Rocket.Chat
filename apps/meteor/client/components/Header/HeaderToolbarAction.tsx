import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn, HeaderV2ToolbarAction, HeaderV1ToolbarAction } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { forwardRef, memo } from 'react';

const HeaderToolbarAction = forwardRef<HTMLButtonElement, ComponentProps<typeof HeaderV1ToolbarAction>>(
	function HeaderToolbarAction(props, ref) {
		return (
			<FeaturePreview feature='newNavigation'>
				<FeaturePreviewOff>
					<HeaderV1ToolbarAction ref={ref} {...props} />
				</FeaturePreviewOff>
				<FeaturePreviewOn>
					<HeaderV2ToolbarAction ref={ref} {...props} />
				</FeaturePreviewOn>
			</FeaturePreview>
		);
	},
);

export default memo(HeaderToolbarAction);
