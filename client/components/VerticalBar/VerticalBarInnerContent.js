import { Box } from '@rocket.chat/fuselage';
import React, { memo } from 'react';

function VerticalBarInnerContent(props) {
	return (
		<Box
			rcx-vertical-bar--inner-content
			position='absolute'
			height='full'
			display='flex'
			insetInline={0}
			{...props}
		/>
	);
}

export default memo(VerticalBarInnerContent);
