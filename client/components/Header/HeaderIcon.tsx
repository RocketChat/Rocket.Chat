import { Box, Icon } from '@rocket.chat/fuselage';
import React, { FC, isValidElement } from 'react';

const HeaderIcon: FC<{ icon: JSX.Element | { name: string; color?: string } | null }> = ({
	icon,
}) =>
	icon && (
		<Box
			display='flex'
			flexShrink={0}
			alignItems='center'
			size={18}
			overflow='hidden'
			justifyContent='center'
		>
			{isValidElement(icon) ? (
				icon
			) : (
				<Icon color='info' size='x18' {...{ name: (icon as any).name }} />
			)}
		</Box>
	);

export default HeaderIcon;
