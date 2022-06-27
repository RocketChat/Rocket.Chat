import { IconButton } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

const ToolBoxAction: FC<any> = ({ id, icon, color, title, action, className, index, ...props }) => (
	<IconButton
		data-qa-id={`ToolBoxAction-${icon}`}
		className={className}
		onClick={action}
		title={title}
		data-toolbox={index}
		key={id}
		icon={icon}
		position='relative'
		tiny
		overflow='visible'
		color={!!color && color}
		{...props}
	/>
);

export default ToolBoxAction;
