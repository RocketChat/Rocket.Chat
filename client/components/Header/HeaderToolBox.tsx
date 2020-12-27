import { ButtonGroup, ButtonGroupProps } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

type HeaderToolBoxProps = ButtonGroupProps;

const HeaderToolBox: FC<HeaderToolBoxProps> = (props) => (
	<ButtonGroup mi='x4' medium {...props}/>
);

export default HeaderToolBox;
