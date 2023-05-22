import { action } from '@storybook/addon-actions';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import VerticalBar from '../../../../components/VerticalBar';
import NotificationsPreferences from './NotificationPreferences';

export default {
	title: 'Room/Contextual Bar/NotificationsPreferences',
	component: NotificationsPreferences,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [(fn) => <VerticalBar height='100vh'>{fn()}</VerticalBar>],
} as ComponentMeta<typeof NotificationsPreferences>;

export const Default: ComponentStory<typeof NotificationsPreferences> = (args) => <NotificationsPreferences {...args} />;
Default.storyName = 'NotificationsPreferences';
Default.args = {
	handleClose: action('handleClose'),
	handleSave: action('handleSaveButton'),
	handlePlaySound: action('handlePlaySound'),
	notificationOptions: {
		alerts: [
			['default', 'Default'],
			['all', 'All_messages'],
			['mentions', 'Mentions'],
			['nothing', 'Nothing'],
		],
	},
};
