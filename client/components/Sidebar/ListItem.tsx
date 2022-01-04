import { Option, OptionColumn } from '@rocket.chat/fuselage';
import React, { ComponentProps, MouseEventHandler, ReactElement } from 'react';

type ListItemProps = {
	text: string;
	icon?: ComponentProps<typeof Option.Icon>['name'];
	input?: any;
	action?: MouseEventHandler<HTMLOrSVGElement>;
};

const ListItem = ({ text, icon, input, action }: ListItemProps): ReactElement => (
	<Option onClick={action}>
		{icon && <Option.Icon name={icon} />}
		<Option.Content>{text}</Option.Content>
		{input && <OptionColumn>{input}</OptionColumn>}
	</Option>
);

export default ListItem;
