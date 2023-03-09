import type { ComponentProps } from 'react';
import React, { forwardRef, memo } from 'react';

import Page from '../Page';

const VerticalBarContent = forwardRef<HTMLElement, ComponentProps<typeof Page.Content>>(function VerticalBarContent(props, ref) {
	return <Page.Content rcx-vertical-bar__content display='flex' {...props} ref={ref} />;
});

export default memo(VerticalBarContent);
