import { Box, Icon } from '@rocket.chat/fuselage';
import type { ComponentProps, FC, ReactElement } from 'react';
import { isValidElement } from 'react';

type HeaderIconProps = { icon: ReactElement | { name: ComponentProps<typeof Icon>['name']; color?: string } | null };

const HeaderIcon: FC<HeaderIconProps> = ({ icon }) =>
	icon && (
		<Box display='flex' flexShrink={0} alignItems='center' size={18} overflow='hidden' justifyContent='center'>
			{isValidElement<any>(icon) ? icon : <Icon color='default' size='x18' name={icon.name} />}
		</Box>
	);

export default HeaderIcon;
