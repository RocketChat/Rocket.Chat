import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

type ImageBoxProps = ComponentPropsWithoutRef<typeof Box>;

const ImageBox = (props: ImageBoxProps) => (
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
