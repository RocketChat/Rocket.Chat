import { Icon } from '@rocket.chat/fuselage';
import type { ComponentProps, FC, ReactElement } from 'react';
import { isValidElement } from 'react';

type HeaderIconProps = {
	icon: ReactElement | Pick<ComponentProps<typeof Icon>, 'name' | 'color'> | null;
};

const HeaderTagIcon: FC<HeaderIconProps> = ({ icon }) => {
	if (!icon) {
		return null;
	}

	return isValidElement<any>(icon) ? icon : <Icon size='x12' mie='x4' {...icon} />;
};

export default HeaderTagIcon;
