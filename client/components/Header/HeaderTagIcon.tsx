import { Box, Icon } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import React, { FC, isValidElement, ReactElement } from 'react';

type HeaderIconProps = { icon: ReactElement | { name: string; color?: string } | null };

const HeaderTagIcon: FC<HeaderIconProps> = ({ icon }) =>
	icon ? (
		<Box w='x16' mie='x2' display='inline-flex' justifyContent='center'>
			{isValidElement(icon) ? icon : <Icon size='x16' color={colors.n700} {...icon} />}
		</Box>
	) : null;

export default HeaderTagIcon;
