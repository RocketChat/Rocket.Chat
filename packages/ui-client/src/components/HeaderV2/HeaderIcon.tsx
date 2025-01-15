import { Box, Icon } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';
import { isValidElement } from 'react';

type HeaderIconProps = { icon: ReactElement | ComponentProps<typeof Icon> | null };

const HeaderIcon = ({ icon }: HeaderIconProps) =>
	icon && (
		<Box display='flex' flexShrink={0} alignItems='center' overflow='hidden' justifyContent='center'>
			{isValidElement<any>(icon) ? icon : <Icon color='default' size='x20' name={icon.name} />}
		</Box>
	);

export default HeaderIcon;
