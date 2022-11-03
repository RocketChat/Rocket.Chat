import { IconButton } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React from 'react';

const ToolBoxAction: FC<any> = ({ id, icon, color, action, className, index, title, 'data-tooltip': tooltip, ...props }) => (
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
		color={!!color && color}
		{...{ ...props, ...(tooltip ? { 'data-tooltip': tooltip, 'title': '' } : { title }) }}
	/>
);

export default ToolBoxAction;
