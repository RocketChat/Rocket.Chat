import { ActionButton } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

const ToolBoxAction: FC<any> = ({ id, icon, color, title, action, className, index, ...props }) => (
	<ActionButton
		className={className}
		onClick={action}
		title={title}
		data-toolbox={index}
		key={id}
		icon={icon}
		position='relative'
		ghost
		tiny
		overflow='visible'
		color={!!color && color}
		{...props}
	/>
);

export default ToolBoxAction;
