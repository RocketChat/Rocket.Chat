import { IconButton } from '@rocket.chat/fuselage';
import { ComponentPropsWithoutRef, forwardRef } from 'react';

interface HeaderToolbarActionProps extends Omit<ComponentPropsWithoutRef<typeof IconButton>, 'action'> {
	'action': (id?: string) => void;
	'index'?: unknown;
	'data-tooltip'?: string;
}

const HeaderToolbarAction = forwardRef<HTMLButtonElement, HeaderToolbarActionProps>(function HeaderToolbarAction(
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
			small
			position='relative'
			overflow='visible'
			{...(tooltip ? { 'data-tooltip': tooltip, 'title': '' } : { title })}
			{...props}
		/>
	);
});

export default HeaderToolbarAction;
