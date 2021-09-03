import { Box, Icon } from '@rocket.chat/fuselage';
import React, { FC, ComponentProps, ReactNode } from 'react';

type CardIconProps = { children: ReactNode } | ComponentProps<typeof Icon>;

const CardIcon: FC<CardIconProps> = ({ name, children, ...props }) => (
	<Box
		minWidth='x16'
		display='inline-flex'
		flexDirection='row'
		alignItems='flex-end'
		justifyContent='center'
	>
		{children || <Icon size='x16' name={name} {...props} />}
	</Box>
);

export default CardIcon;
