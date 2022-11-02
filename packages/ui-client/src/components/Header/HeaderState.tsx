import { Icon, IconButton } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React from 'react';

const HeaderState: FC<any> = (props) => (props.onClick ? <IconButton mini {...props} /> : <Icon size={16} name={props.icon} {...props} />);

export default HeaderState;
