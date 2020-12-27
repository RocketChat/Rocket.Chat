import { ActionButton, ActionButtonProps } from '@rocket.chat/fuselage';
import React, { FC, MouseEvent } from 'react';

type HeaderToolBoxActionProps = Omit<ActionButtonProps, 'id' | 'action'> & {
	id?: string;
	tabId?: string;
	index: number;
	action?: (event: MouseEvent<HTMLElement>) => void;
};

const HeaderToolBoxAction: FC<HeaderToolBoxActionProps> = ({ id, icon, title, action, tabId, index, ...props }) => <ActionButton
	primary={tabId === id}
	title={title}
	icon={icon}
	ghost
	tiny
	position='relative'
	overflow='visible'
	data-toolbox={index}
	onClick={action}
	{...props}
/>;

export default HeaderToolBoxAction;
