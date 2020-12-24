import { Box, BoxProps } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

type HeaderContentRowProps = BoxProps;

const HeaderContentRow: FC<HeaderContentRowProps> = (props) => (
	<Box
		alignItems='center'
		flexShrink={1}
		flexGrow={1}
		display='flex'
		{...props}
	/>
);

export default HeaderContentRow;
