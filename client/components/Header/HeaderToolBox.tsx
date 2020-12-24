import { ButtonGroup, ButtonGroupProps } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

type HeaderToolBoxProps = ButtonGroupProps;

const HeaderToolBox: FC<HeaderToolBoxProps> = (props) => (
	<ButtonGroup small {...props}/>
);

export default HeaderToolBox;
