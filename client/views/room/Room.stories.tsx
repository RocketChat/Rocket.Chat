import React, { ReactElement } from 'react';

import { RoomTemplate } from './components/RoomTemplate/RoomTemplate';

export default {
	title: 'room',
	component: RoomTemplate,
};

export const Default = (): ReactElement => (
	<RoomTemplate>
		<RoomTemplate.Header>header</RoomTemplate.Header>
		<RoomTemplate.Body>body</RoomTemplate.Body>
		<RoomTemplate.Body>body</RoomTemplate.Body>
		<RoomTemplate.Footer>footer</RoomTemplate.Footer>
		<RoomTemplate.Aside>Aside</RoomTemplate.Aside>
	</RoomTemplate>
);
