import { Box } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

const VerticalBarInnerContent: FC = (props) => (
	<Box
		rcx-vertical-bar--inner-content
		position='absolute'
		height='full'
		display='flex'
		insetInline={0}
		{...props}
	/>
);

export default memo(VerticalBarInnerContent);
