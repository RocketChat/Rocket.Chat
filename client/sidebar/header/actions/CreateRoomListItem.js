import { Box, Option } from '@rocket.chat/fuselage';
import React from 'react';

export default function CreateRoomListItem({ text, icon, action }) {
	return (
		<Box is='li' onClick={action}>
			<Option>
				<Option.Icon name={icon} size={20} />
				<Option.Content>{text}</Option.Content>
			</Option>
		</Box>
	);
}
