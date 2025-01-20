import { action } from '@storybook/addon-actions';
import type { Meta, StoryFn } from '@storybook/react';

import NotificationsPreferences from './NotificationPreferences';
import { Contextualbar } from '../../../../components/Contextualbar';

export default {
	title: 'Room/Contextual Bar/NotificationsPreferences',
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
