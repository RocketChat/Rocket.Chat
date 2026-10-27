import { css } from '@rocket.chat/css-in-js';
import type { ComponentProps } from 'react';
import { forwardRef, memo } from 'react';

import { PageScrollableContent } from '../Page';

// `.rcx-box` outranks a child's own margin class, so the spacing doesn't depend on which style was injected first
const childrenSpacing = css`
	& > *,
	& > .rcx-box {
		margin-block-end: 16px;
	}
`;

const ContextualbarScrollableContent = forwardRef<HTMLElement, ComponentProps<typeof PageScrollableContent>>(
	function ContextualbarScrollableContent({ className, ...props }, ref) {
		return <PageScrollableContent paddingInline={16} className={[childrenSpacing, ...[className].flat()]} {...props} ref={ref} />;
	},
);

export default memo(ContextualbarScrollableContent);
