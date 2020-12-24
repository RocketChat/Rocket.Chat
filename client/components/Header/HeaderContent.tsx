import { Box, BoxProps } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

type HeaderContentProps = BoxProps;

const HeaderContent: FC<HeaderContentProps> = (props) => (
	<Box
		flexGrow={1}
		width={1}
		flexShrink={1}
		mi='x4'
		display='flex'
		justifyContent='center'
		flexDirection='column'
		{...props}
	/>
);

export default HeaderContent;
