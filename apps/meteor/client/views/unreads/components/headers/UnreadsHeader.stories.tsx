import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import VerticalBar from '../../../../components/VerticalBar';
import UnreadsHeader from './UnreadsHeader';

export default {
	title: 'Unreads/components/header/UnreadsHeader',
	component: UnreadsHeader,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [(fn) => <VerticalBar height='100vh'>{fn()}</VerticalBar>],
} as ComponentMeta<typeof UnreadsHeader>;

export const Default: ComponentStory<typeof UnreadsHeader> = (args) => <UnreadsHeader {...args} />;
Default.storyName = 'UnreadsHeader';

Default.args = {
	totalMessages: 12,
	totalRooms: 4,
	sortBy: 'Activity',
};
