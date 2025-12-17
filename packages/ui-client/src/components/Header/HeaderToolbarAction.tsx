import type { ComponentPropsWithoutRef } from 'react';
import { forwardRef, memo } from 'react';

import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '../FeaturePreview';
import { HeaderV1ToolbarAction } from '../HeaderV1';
import { HeaderV2ToolbarAction } from '../HeaderV2';

const HeaderToolbarAction = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<typeof HeaderV1ToolbarAction>>(
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
