import { Margins } from '@rocket.chat/fuselage';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { forwardRef, memo } from 'react';

import { PageScrollableContent } from '../Page';

const ContextualbarScrollableContent = forwardRef<HTMLElement, ComponentProps<typeof PageScrollableContent>>(
	function ContextualbarScrollableContent({ children, ...props }, ref) {
		return (
			<FeaturePreview feature='newNavigation'>
				<FeaturePreviewOff>
					<PageScrollableContent p={24} {...props} ref={ref}>
						<Margins blockEnd={16}>{children}</Margins>
					</PageScrollableContent>
				</FeaturePreviewOff>
				<FeaturePreviewOn>
					<PageScrollableContent paddingInline={16} {...props} ref={ref}>
						<Margins blockEnd={16}>{children}</Margins>
					</PageScrollableContent>
				</FeaturePreviewOn>
			</FeaturePreview>
		);
	},
);

export default memo(ContextualbarScrollableContent);
