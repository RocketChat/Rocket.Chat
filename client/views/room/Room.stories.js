import React from 'react';

import { Room } from '.';

export default {
	title: 'views/Room',
	component: Room,
};

export const Default = () => <Room>
	<Room.Header>header</Room.Header>
	<Room.Body>body</Room.Body>
	<Room.Body>body</Room.Body>
	<Room.Footer>footer</Room.Footer>
	<Room.Aside>Aside</Room.Aside>
</Room>;
