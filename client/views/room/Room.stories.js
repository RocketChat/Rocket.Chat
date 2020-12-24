import React from 'react';

import { RoomTemplate } from './components/RoomTemplate';

export default {
	title: 'views/Room',
	component: RoomTemplate,
};

export const Default = () => <RoomTemplate>
	<RoomTemplate.Header>header</RoomTemplate.Header>
	<RoomTemplate.Body>body</RoomTemplate.Body>
	<RoomTemplate.Body>body</RoomTemplate.Body>
	<RoomTemplate.Footer>footer</RoomTemplate.Footer>
	<RoomTemplate.Aside>Aside</RoomTemplate.Aside>
</RoomTemplate>;
