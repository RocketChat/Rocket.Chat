import { action } from '@storybook/addon-actions';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import CreateCannedResponseModal from './CreateCannedResponseModal';

export default {
	title: 'Enterprise/Omnichannel/CreateCannedResponseModal',
	component: CreateCannedResponseModal,
	parameters: {
		actions: {
			argTypesRegex: '^on.*',
		},
	},
} as ComponentMeta<typeof CreateCannedResponseModal>;

const Template: ComponentStory<typeof CreateCannedResponseModal> = (args) => <CreateCannedResponseModal {...args} />;

export const Default = Template.bind({});
Default.args = {
	isManager: true,
	values: {
		shortcut: 'test',
		tags: ['test'],
		scope: 'department',
	},
	handlers: {
		handleShortcut: action('handleShortcut'),
		handleTags: action('handleTags'),
		handleDepartment: action('handleDepartment'),
	},
	errors: {},
	hasUnsavedChanges: true,
	radioHandlers: {
		setPublic: action('setPublic'),
		setDepartment: action('setDepartment'),
		setPrivate: action('setPrivate'),
	},
	radioDescription: 'Anyone in the selected department can access this canned response',
};
