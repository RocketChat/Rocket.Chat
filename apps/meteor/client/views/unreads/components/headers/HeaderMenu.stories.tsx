import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import VerticalBar from '../../../../components/VerticalBar';
import HeaderMenu from './HeaderMenu';

export default {
	title: 'Unreads/components/header/HeaderMenu',
	component: HeaderMenu,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [(fn) => <VerticalBar height='100vh'>{fn()}</VerticalBar>],
} as ComponentMeta<typeof HeaderMenu>;

export const Default: ComponentStory<typeof HeaderMenu> = (args) => <HeaderMenu {...args} />;
Default.storyName = 'HeaderMenu';

Default.args = {
	sortBy: 'Activity',
};
