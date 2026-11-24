import { css } from '@rocket.chat/css-in-js';
import type { ComponentProps } from 'react';
import { forwardRef, memo } from 'react';

import { PageScrollableContent } from '../Page';

// An empty last item, so the gap also leaves room below the last child when scrolled to the end
const trailingGap = css`
	&::after {
		content: '';
		flex-shrink: 0;
	}
`;

const ContextualbarScrollableContent = forwardRef<HTMLElement, ComponentProps<typeof PageScrollableContent>>(
	function ContextualbarScrollableContent({ className, ...props }, ref) {
		return <PageScrollableContent paddingInline='x16' gap='x16' {...props} className={[className, trailingGap].flat()} ref={ref} />;
	},
);

export default memo(ContextualbarScrollableContent);
