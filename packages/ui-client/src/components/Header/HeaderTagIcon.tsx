import { Box, Icon } from '@rocket.chat/fuselage';
import type { ComponentProps, FC, ReactElement } from 'react';
import React, { isValidElement } from 'react';

type HeaderIconProps = {
	icon: ReactElement | Pick<ComponentProps<typeof Icon>, 'name' | 'color'> | null;
};

const HeaderTagIcon: FC<HeaderIconProps> = ({ icon }) =>
	icon ? (
		<Box w='x16' mie='x2' display='inline-flex' justifyContent='center'>
			{isValidElement(icon) ? icon : <Icon size='x16' color='hint' {...icon} />}
		</Box>
	) : null;

export default HeaderTagIcon;
