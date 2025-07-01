import { Box, Icon } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';
import { isValidElement } from 'react';

const SidePanelTagIcon = ({ icon }: { icon: ReactElement | Pick<ComponentProps<typeof Icon>, 'name' | 'color'> | null }) => {
	if (isValidElement(icon)) {
		return <Box>{icon}</Box>;
	}

	return icon && typeof icon === 'object' && 'name' in icon ? <Icon size='x12' mie={4} {...icon} /> : null;
};

export default SidePanelTagIcon;
