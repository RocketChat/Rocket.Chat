import type { IconProps } from '@rocket.chat/fuselage';
import { Icon } from '@rocket.chat/fuselage';

export type SidePanelTagIconProps = { icon: Pick<IconProps, 'name' | 'color'> | null };

const SidePanelTagIcon = ({ icon }: SidePanelTagIconProps) => (icon ? <Icon size='x12' marginInlineEnd={4} {...icon} /> : null);

export default SidePanelTagIcon;
