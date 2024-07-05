import { IconButton } from '@rocket.chat/fuselage';
import { forwardRef } from 'react';

// TODO: remove any and type correctly
const HeaderToolbarAction = forwardRef<HTMLButtonElement, any>(function HeaderToolbarAction(
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
