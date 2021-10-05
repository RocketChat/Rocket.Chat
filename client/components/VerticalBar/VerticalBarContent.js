import React, { forwardRef, memo } from 'react';

import Page from '../Page';

const VerticalBarContent = forwardRef(function VerticalBarContent(props, ref) {
	return <Page.Content rcx-vertical-bar__content display='flex' {...props} ref={ref} />;
});

export default memo(VerticalBarContent);
