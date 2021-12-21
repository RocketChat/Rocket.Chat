import { Option, OptionColumn } from '@rocket.chat/fuselage';
import React from 'react';

const style = {
	'padding-right': '24px',
};

function SortListItem({ text, icon, input }) {
	return (
		<Option display='flex' w='100%'>
			<Option.Icon name={icon} size={20} />
			<Option.Content style={style}>{text}</Option.Content>
			<OptionColumn>{input}</OptionColumn>
		</Option>
	);
}

export default SortListItem;
