import { action } from '@storybook/addon-actions';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import VerticalBar from '../../../../../components/VerticalBar';
import EditInvite from './EditInvite';

export default {
	title: 'Room/Contextual Bar/RoomMembers/EditInvite',
	component: EditInvite,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	decorators: [(fn) => <VerticalBar height='100vh'>{fn()}</VerticalBar>],
} as ComponentMeta<typeof EditInvite>;

export const Default: ComponentStory<typeof EditInvite> = (args) => <EditInvite {...args} />;
Default.storyName = 'EditInvite';
Default.args = {
	days: 15,
	maxUses: 25,
	setDays: action('setDays'),
	setMaxUses: action('setMaxUses'),
};
