import { Icon } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

export type SidePanelTagIconProps = { icon: Pick<ComponentProps<typeof Icon>, 'name' | 'color'> | null };

const SidePanelTagIcon = ({ icon }: SidePanelTagIconProps) => (icon ? <Icon size='x12' mie={4} {...icon} /> : null);

export default SidePanelTagIcon;
