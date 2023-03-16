import { Option, OptionColumn, OptionContent, OptionIcon } from '@rocket.chat/fuselage';
import type { ComponentProps, MouseEventHandler, ReactElement, ReactNode } from 'react';
import React from 'react';

type ListItemProps = {
	icon?: ComponentProps<typeof OptionIcon>['name'];
	text: ReactNode;
	input?: ReactNode;
	loading?: boolean;
	action?: MouseEventHandler<HTMLOrSVGElement>;
	children?: ReactNode;
} & ComponentProps<typeof Option>;

const ListItem = ({ icon, text, input, action, children, ...props }: ListItemProps): ReactElement => (
	<Option onClick={action} {...props}>
		{icon && <OptionIcon name={icon} />}
		<OptionContent>{text}</OptionContent>
		{input && <OptionColumn>{input}</OptionColumn>}
		{children && <OptionColumn>{children}</OptionColumn>}
	</Option>
);

export default ListItem;
