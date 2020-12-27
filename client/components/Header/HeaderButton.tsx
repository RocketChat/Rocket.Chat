import { Box, BoxProps } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

type HeaderButtonProps = BoxProps;

const HeaderButton: FC<HeaderButtonProps> = (props: any) => (
	<Box
		mi='x4'
		display='flex'
		alignItems='center'
		{...props}
	/>
);

export default HeaderButton;
