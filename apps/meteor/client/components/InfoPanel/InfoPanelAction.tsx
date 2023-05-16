import { Icon, Button } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import React from 'react';

type InfoPanelActionProps = Omit<ComponentProps<typeof Button>, 'label'> & {
	icon?: ComponentProps<typeof Icon>['name'];
	label: ReactNode;
};

const InfoPanelAction = ({ label, icon, ...props }: InfoPanelActionProps): ReactElement => (
	<Button
		title={typeof label === 'string' ? label : undefined}
		aria-label={typeof label === 'string' ? label : undefined}
		{...props}
		mi='x4'
	>
		{icon && <Icon name={icon} size='x20' mie='x4' />}
		{label}
	</Button>
);

export default InfoPanelAction;
