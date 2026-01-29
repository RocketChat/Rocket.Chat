import { Icon } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

const SidePanelTagIcon = ({ icon }: { icon: Pick<ComponentProps<typeof Icon>, 'name' | 'color'> | null }) =>
	icon ? <Icon size='x12' mie={4} {...icon} /> : null;

export default SidePanelTagIcon;
