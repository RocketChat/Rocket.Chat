import { Button, Icon } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { FC, HtmlHTMLAttributes } from 'react';
import React from 'react';

type AgentInfoActionProps = {
	icon: IconName;
	label?: string;
	title?: string;
} & Omit<HtmlHTMLAttributes<HTMLElement>, 'is'>;

const AgentInfoAction: FC<AgentInfoActionProps> = ({ icon, label, ...props }) => (
	<Button data-qa={`AgentInfoAction-${label}`} title={label} {...props} mi='x4'>
		<Icon name={icon} size='x20' mie='x4' />
		{label}
	</Button>
);

export default AgentInfoAction;
