import { Button } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { HTMLAttributes } from 'react';

type AgentInfoActionProps = {
	icon: IconName;
	label?: string;
	title?: string;
} & Omit<HTMLAttributes<HTMLElement>, 'is'>;

const AgentInfoAction = ({ icon, label, ...props }: AgentInfoActionProps) => (
	<Button icon={icon} title={label} {...props}>
		{label}
	</Button>
);

export default AgentInfoAction;
