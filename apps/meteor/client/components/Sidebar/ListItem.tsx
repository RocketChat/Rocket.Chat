import { Badge, Option, OptionColumn, OptionContent, OptionIcon, OptionSkeleton } from '@rocket.chat/fuselage';
import type { ComponentProps, MouseEventHandler, ReactElement, ReactNode } from 'react';
import React from 'react';

type ListItemProps = {
	text: ReactNode;
	icon?: ComponentProps<typeof OptionIcon>['name'];
	input?: any;
	loading?: boolean;
	notifications?: number;
	action?: MouseEventHandler<HTMLOrSVGElement>;
};

const ListItem = ({ text, icon, input, action, loading, notifications }: ListItemProps): ReactElement => {
	if (loading) {
		return <OptionSkeleton />;
	}

	return (
		<Option onClick={action}>
			{icon && <OptionIcon name={icon} />}
			<OptionContent>{text}</OptionContent>
			{input && <OptionColumn>{input}</OptionColumn>}
			{notifications && (
				<OptionColumn>
					<Badge variant='primary'>{notifications}</Badge>
				</OptionColumn>
			)}
		</Option>
	);
};

export default ListItem;
