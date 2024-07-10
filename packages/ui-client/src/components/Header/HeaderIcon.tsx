import { Box, Icon } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { FC, ReactElement } from 'react';
import { isValidElement } from 'react';

type HeaderIconProps = { icon: ReactElement | { name: IconName; color?: string } | null };

const HeaderIcon: FC<HeaderIconProps> = ({ icon }) =>
	icon && (
		<Box display='flex' flexShrink={0} alignItems='center' size='x18' overflow='hidden' justifyContent='center'>
			{isValidElement<any>(icon) ? icon : <Icon color='default' size='x18' name={icon.name} />}
		</Box>
	);

export default HeaderIcon;
