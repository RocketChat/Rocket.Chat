import { Icon, IconButton } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

const State: FC<any> = (props) => (props.onClick ? <IconButton mini {...props} /> : <Icon size={16} name={props.icon} {...props} />);

export default State;
