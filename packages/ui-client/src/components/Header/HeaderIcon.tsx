import { Box, Icon } from '@rocket.chat/fuselage';
import type { FC, ReactElement } from 'react';
import React, { isValidElement } from 'react';

type HeaderIconProps = { icon: ReactElement | { name: string; color?: string } | null };

const HeaderIcon: FC<HeaderIconProps> = ({ icon }) =>
	icon && (
		<Box display='flex' flexShrink={0} alignItems='center' size={18} overflow='hidden' justifyContent='center'>
			{isValidElement(icon) ? icon : <Icon color='annotation' size='x18' {...{ name: (icon as any).name }} />}
		</Box>
	);

export default HeaderIcon;
