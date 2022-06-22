import { ActionButton } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

const ToolBoxAction: FC<any> = ({ id, icon, color, action, className, index, title, 'data-tooltip': tooltip, ...props }) => (
	<ActionButton
		className={className}
		onClick={action}
		data-toolbox={index}
		key={id}
		icon={icon}
		position='relative'
		ghost
		tiny
		overflow='visible'
		color={!!color && color}
		{...{ ...props, ...(tooltip ? { 'data-tooltip': tooltip, 'title': '' } : { title }) }}
	/>
);

export default ToolBoxAction;
