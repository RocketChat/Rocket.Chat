import { Contextualbar } from '@rocket.chat/ui-client';
import type { Meta, StoryFn } from '@storybook/react';
import { action } from 'storybook/actions';

import NotificationsPreferences from './NotificationPreferences';

export default {
	component: NotificationsPreferences,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [(fn) => <Contextualbar height='100vh'>{fn()}</Contextualbar>],
} satisfies Meta<typeof NotificationsPreferences>;

export const Default: StoryFn<typeof NotificationsPreferences> = (args) => <NotificationsPreferences {...args} />;
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
