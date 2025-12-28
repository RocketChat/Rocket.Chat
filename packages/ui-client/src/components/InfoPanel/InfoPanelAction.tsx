import { Button } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { ComponentProps, ReactElement, ReactNode } from 'react';

type InfoPanelActionProps = Omit<ComponentProps<typeof Button>, 'label'> & {
	icon?: IconName;
	label: ReactNode;
};

const InfoPanelAction = ({ label, icon, ...props }: InfoPanelActionProps): ReactElement => (
	<Button
		title={typeof label === 'string' ? label : undefined}
		aria-label={typeof label === 'string' ? label : undefined}
		{...props}
		icon={icon}
	>
		{label}
	</Button>
);

export default InfoPanelAction;
