import { Option, OptionColumn } from '@rocket.chat/fuselage';
import React from 'react';

function ListItem({ text, icon, input, action }) {
	return (
		<Option onClick={action || null}>
			{icon && <Option.Icon name={icon} size={20} />}
			<Option.Content>{text}</Option.Content>
			{input && <OptionColumn>{input}</OptionColumn>}
		</Option>
	);
}

export default ListItem;
