import { Box } from '@rocket.chat/fuselage';
import React, { memo } from 'react';

const style = {
	left: '0',
	right: '0',
};

const VerticalBarInnerContent = (props) => (
	<Box
		rcx-vertical-bar--inner-content
		position='absolute'
		height='full'
		display='flex'
		style={style}
		{...props}
	/>
);

export default memo(VerticalBarInnerContent);
