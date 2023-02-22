import { Option, OptionColumn, OptionContent, OptionIcon } from '@rocket.chat/fuselage';
import type { ComponentProps, MouseEventHandler, ReactElement, ReactNode } from 'react';
import React from 'react';

type ListItemProps = {
	text: ReactNode;
	icon?: ComponentProps<typeof OptionIcon>['name'];
	input?: any;
	loading?: boolean;
	action?: MouseEventHandler<HTMLOrSVGElement>;
	children?: ReactNode;
};

const ListItem = ({ text, icon, input, action, children }: ListItemProps): ReactElement => (
	<Option onClick={action}>
		{icon && <OptionIcon name={icon} />}
		<OptionContent>{text}</OptionContent>
		{input && <OptionColumn>{input}</OptionColumn>}
		{children && <OptionColumn>{children}</OptionColumn>}
	</Option>
);

export default ListItem;
