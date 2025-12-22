import { Margins } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef, memo } from 'react';

import { PageScrollableContent } from '../Page';

const ContextualbarScrollableContent = forwardRef<HTMLElement, ComponentProps<typeof PageScrollableContent>>(
	function ContextualbarScrollableContent({ children, ...props }, ref) {
		return (
			<PageScrollableContent paddingInline={16} {...props} ref={ref}>
				<Margins blockEnd={16}>{children}</Margins>
			</PageScrollableContent>
		);
	},
);

export default memo(ContextualbarScrollableContent);
