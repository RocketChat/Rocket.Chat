import { Button } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { FC, HtmlHTMLAttributes } from 'react';
import React from 'react';

type AgentInfoActionProps = {
	icon: IconName;
	label?: string;
	title?: string;
} & Omit<HtmlHTMLAttributes<HTMLElement>, 'is'>;

const AgentInfoAction: FC<AgentInfoActionProps> = ({ icon, label, ...props }) => (
	<Button icon={icon} data-qa={`AgentInfoAction-${label}`} title={label} {...props} mi={4}>
		{label}
	</Button>
);

export default AgentInfoAction;
