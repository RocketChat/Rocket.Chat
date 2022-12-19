import { IconButton } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React, { forwardRef } from 'react';

const ToolBoxAction: FC<any> = forwardRef(function ToolBoxAction(
	{ id, icon, color, action, className, index, title, 'data-tooltip': tooltip, ...props },
	ref,
) {
	return (
		<IconButton
			data-qa-id={`ToolBoxAction-${icon}`}
			className={className}
			onClick={() => action(id)}
			data-toolbox={index}
			key={id}
			icon={icon}
			position='relative'
			tiny
			overflow='visible'
			ref={ref}
			color={!!color && color}
			{...{ ...props, ...(tooltip ? { 'data-tooltip': tooltip, 'title': '' } : { title }) }}
		/>
	);
});

export default ToolBoxAction;
