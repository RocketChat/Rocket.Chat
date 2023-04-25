import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';
import React from 'react';

const ImageBox: FC<ComponentProps<typeof Box>> = (props) => (
	<Box
		display='flex'
		maxWidth='full'
		flexDirection='column'
		justifyContent='center'
		alignItems='center'
		alignContent='center'
		borderRadius={2}
		borderWidth='default'
		borderStyle='solid'
		borderColor='extra-light'
		position='relative'
		{...props}
	/>
);

export default ImageBox;
