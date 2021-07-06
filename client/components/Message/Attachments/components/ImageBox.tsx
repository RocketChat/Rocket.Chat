import { Box } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC } from 'react';

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
		borderColor='neutral-200'
		{...props}
	/>
);

export default ImageBox;
