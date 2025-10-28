import { Box, Icon } from '@rocket.chat/fuselage';
import type { ComponentProps, FC, ReactElement } from 'react';
import { isValidElement } from 'react';

type HeaderIconProps = {
	icon: ReactElement | Pick<ComponentProps<typeof Icon>, 'name' | 'color'> | null;
};

const HeaderTagIcon: FC<HeaderIconProps> = ({ icon }) => {
	if (!icon) {
		return null;
	}

	return isValidElement<any>(icon) ? (
		<Box marginInlineEnd={4} display='inline-block' verticalAlign='middle'>
			{icon}
		</Box>
	) : (
		<Icon size='x12' mie={4} {...icon} />
	);
};

export default HeaderTagIcon;
