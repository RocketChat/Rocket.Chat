import { Button, Icon, IconProps } from '@rocket.chat/fuselage';
import React, { FC, HtmlHTMLAttributes } from 'react';

type AgentInfoActionProps = {
	icon: IconProps['name'];
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
