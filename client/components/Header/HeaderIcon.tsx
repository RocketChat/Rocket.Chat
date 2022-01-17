import { Box, Icon } from '@rocket.chat/fuselage';
import React, { FC, isValidElement, ReactElement } from 'react';

type HeaderIconProps = { icon: ReactElement | { name: string; color?: string } | null };

const HeaderIcon: FC<HeaderIconProps> = ({ icon }) =>
	icon && (
		<Box display='flex' flexShrink={0} alignItems='center' size={18} overflow='hidden' justifyContent='center'>
			{isValidElement(icon) ? icon : <Icon color='info' size='x18' {...{ name: (icon as any).name }} />}
		</Box>
	);

export default HeaderIcon;
