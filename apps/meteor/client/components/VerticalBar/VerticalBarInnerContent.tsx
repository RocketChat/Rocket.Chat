import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement, memo, ComponentProps } from 'react';

const VerticalBarInnerContent = (props: ComponentProps<typeof Box>): ReactElement => (
	<Box rcx-vertical-bar--inner-content position='absolute' height='full' display='flex' insetInline={0} {...props} />
);

export default memo(VerticalBarInnerContent);
