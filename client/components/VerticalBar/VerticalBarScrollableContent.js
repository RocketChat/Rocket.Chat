import { Margins } from '@rocket.chat/fuselage';
import React, { forwardRef, memo } from 'react';

import Page from '../Page';

const VerticalBarScrollableContent = forwardRef(function VerticalBarScrollableContent(
	{ children, ...props },
	ref,
) {
	return (
		<Page.ScrollableContent p='x24' {...props} ref={ref}>
			<Margins blockEnd='x16'>{children}</Margins>
		</Page.ScrollableContent>
	);
});

export default memo(VerticalBarScrollableContent);
