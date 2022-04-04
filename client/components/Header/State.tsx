import { Icon, ActionButton } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

const State: FC<any> = (props) =>
	props.onClick ? <ActionButton ghost mini {...props} /> : <Icon size={16} name={props.icon} {...props} />;

export default State;
