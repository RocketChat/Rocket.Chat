import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import { RoomTemplate } from './components/RoomTemplate/RoomTemplate';

export default {
	title: 'Room/RoomTemplate',
	component: RoomTemplate,
} as ComponentMeta<typeof RoomTemplate>;

export const Default: ComponentStory<typeof RoomTemplate> = () => (
	<RoomTemplate>
		<RoomTemplate.Header>header</RoomTemplate.Header>
		<RoomTemplate.Body>body</RoomTemplate.Body>
		<RoomTemplate.Footer>footer</RoomTemplate.Footer>
		<RoomTemplate.Aside>Aside</RoomTemplate.Aside>
	</RoomTemplate>
);
Default.storyName = 'RoomTemplate';
