import type { ComponentProps } from 'react';
import { forwardRef, memo } from 'react';

import { PageScrollableContent } from '../Page';

const ContextualbarScrollableContent = forwardRef<HTMLElement, ComponentProps<typeof PageScrollableContent>>(
	function ContextualbarScrollableContent(props, ref) {
		return <PageScrollableContent paddingInline={16} gap={16} {...props} ref={ref} />;
	},
);

export default memo(ContextualbarScrollableContent);
