import { Box, Icon } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { ReactElement } from 'react';
import { isValidElement } from 'react';

type HeaderIconProps = { icon: ReactElement | { name: IconName; color?: string } | null };

const HeaderIcon = ({ icon }: HeaderIconProps) =>
	icon && (
		<Box display='flex' flexShrink={0} alignItems='center' overflow='hidden' justifyContent='center'>
			{isValidElement<any>(icon) ? icon : <Icon color='default' size='x20' name={icon.name} />}
		</Box>
	);

export default HeaderIcon;
