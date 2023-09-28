import { Margins } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import React, { forwardRef, memo } from 'react';

import Page from '../Page';

const ContextualbarScrollableContent = forwardRef<HTMLElement, ComponentProps<typeof Page.ScrollableContent>>(
	function ContextualbarScrollableContent({ children, ...props }, ref) {
		return (
			<Page.ScrollableContent p={24} {...props} ref={ref}>
				<Margins blockEnd={16}>{children}</Margins>
			</Page.ScrollableContent>
		);
	},
);

export default memo(ContextualbarScrollableContent);
