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
	function ContextualbarScrollableContent(props, ref) {
		return <PageScrollableContent paddingInline={16} gap={16} className={trailingGap} {...props} ref={ref} />;
	},
);

export default memo(ContextualbarScrollableContent);
