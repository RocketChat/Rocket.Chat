import { Margins } from '@rocket.chat/fuselage';
import React, { forwardRef, memo, ComponentProps } from 'react';

import Page from '../Page';

const VerticalBarScrollableContent = forwardRef<HTMLElement, ComponentProps<typeof Page.ScrollableContent>>(
	function VerticalBarScrollableContent({ children, ...props }, ref) {
		return (
			<Page.ScrollableContent p='x24' {...props} ref={ref}>
				<Margins blockEnd='x16'>{children}</Margins>
			</Page.ScrollableContent>
		);
	},
);

export default memo(VerticalBarScrollableContent);
