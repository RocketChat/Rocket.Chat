import type { Icon } from '@rocket.chat/fuselage';
import { IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';

type ToolBoxActionProps = {
	'id': string;
	'icon': ComponentProps<typeof Icon>['name'];
	'action': (id: string) => void;
	'index': string;
	'title': string;
	'data-tooltip': string;
} & ComponentProps<typeof IconButton>;

const ToolBoxAction = forwardRef<HTMLButtonElement, ToolBoxActionProps>(function ToolBoxAction(
	{ id, icon, action, index, title, 'data-tooltip': tooltip, ...props },
	ref,
) {
	return (
		<IconButton
			data-qa-id={`ToolBoxAction-${icon}`}
			ref={ref}
			onClick={() => action(id)}
			data-toolbox={index}
			key={id}
			icon={icon}
			tiny
			{...(tooltip ? { 'data-tooltip': tooltip, 'title': '' } : { title })}
			{...props}
		/>
	);
});

export default ToolBoxAction;
