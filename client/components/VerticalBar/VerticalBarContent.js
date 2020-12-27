import React, { forwardRef, memo } from 'react';

import Page from '../Page';

const VerticalBarContent = forwardRef((props, ref) => (
	<Page.Content rcx-vertical-bar__content display='flex' {...props} ref={ref}/>
));
VerticalBarContent.displayName = 'VerticalBarContent';

export default memo(VerticalBarContent);
