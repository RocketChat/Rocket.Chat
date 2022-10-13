import { Option, OptionColumn, OptionContent, OptionIcon } from '@rocket.chat/fuselage';
import React, { ComponentProps, MouseEventHandler, ReactElement, ReactNode } from 'react';

type ListItemProps = {
	text: ReactNode;
	icon?: ComponentProps<typeof OptionIcon>['name'];
	input?: any;
	action?: MouseEventHandler<HTMLOrSVGElement>;
};

const ListItem = ({ text, icon, input, action }: ListItemProps): ReactElement => (
	<Option onClick={action}>
		{icon && <OptionIcon name={icon} />}
		<OptionContent>{text}</OptionContent>
		{input && <OptionColumn>{input}</OptionColumn>}
	</Option>
);

export default ListItem;
