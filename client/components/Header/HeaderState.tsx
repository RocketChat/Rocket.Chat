import { Icon, ActionButton, IconProps, ActionButtonProps } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

type HeaderStateProps = ActionButtonProps & IconProps;

const HeaderState: FC<HeaderStateProps> = (props) => (
	props.onClick
		? <ActionButton ghost mini {...props}/>
		: <Icon size={16} name={props.icon} {...props}/>
);

export default HeaderState;
