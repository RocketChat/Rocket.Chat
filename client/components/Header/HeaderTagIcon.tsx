import { Box, Icon } from '@rocket.chat/fuselage';
import React, { FC, isValidElement, ReactElement } from 'react';

type HeaderIconProps = { icon: ReactElement | { name: string; color?: string } | null };

const HeaderTagIcon: FC<HeaderIconProps> = ({ icon }) =>
	icon ? (
		<Box w='x20' mi='x2' display='inline-flex' justifyContent='center'>
			{isValidElement(icon) ? icon : <Icon size='x20' {...icon} />}
		</Box>
	) : null;

export default HeaderTagIcon;
