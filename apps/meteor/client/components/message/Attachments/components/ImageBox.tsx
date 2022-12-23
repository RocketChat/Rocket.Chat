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
		borderRadius='x2'
		borderWidth='x2'
		borderStyle='solid'
		borderColor='extra-light'
		{...props}
	/>
);

export default ImageBox;
