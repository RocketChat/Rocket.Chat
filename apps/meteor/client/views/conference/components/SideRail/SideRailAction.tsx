import { IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

type SideRailActionProps = {
	label: string;
	pressed?: boolean;
	onClick: () => void;
	icon: ComponentProps<typeof IconButton>['icon'];
};

const SideRailAction = ({ label, icon, pressed, onClick }: SideRailActionProps) => (
	<IconButton icon={icon} small title={label} aria-label={label} pressed={pressed} onClick={onClick} />
);

export default SideRailAction;
