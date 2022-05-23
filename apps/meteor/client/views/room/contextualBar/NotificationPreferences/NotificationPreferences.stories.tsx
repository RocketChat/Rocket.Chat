import { action } from '@storybook/addon-actions';
import { ComponentMeta, ComponentStory } from '@storybook/react';
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
	formValues: {
		turnOn: true,
		muteGroupMentions: false,
		showCounter: true,
		showMentions: true,
		desktopAlert: 'default',
		desktopSound: 'chime',
		mobileAlert: 'mentions',
		emailAlert: 'nothing',
	},
	formHandlers: {
		handleTurnOn: action('formHandlers.handleTurnOn'),
		handleMuteGroupMentions: action('formHandlers.handleMuteGroupMentions'),
		handleShowMentions: action('formHandlers.handleShowMentions'),
		handleShowCounter: action('formHandlers.handleShowCounter'),
		handleDesktopAlert: action('formHandlers.handleDesktopAlert'),
		handleDesktopSound: action('formHandlers.handleDesktopSound'),
		handleMobileAlert: action('formHandlers.handleMobileAlert'),
		handleEmailAlert: action('formHandlers.handleEmailAlert'),
	},
	handlePlaySound: action('handlePlaySound'),
	handleClose: action('handleClose'),
	handleSaveButton: action('handleSaveButton'),
	handleOptions: {
		alerts: [
			['default', 'Default'],
			['all', 'All_messages'],
			['mentions', 'Mentions'],
			['nothing', 'Nothing'],
		],
		audio: [
			['default', 'Default'],
			['all', 'All_messages'],
			['mentions', 'Mentions'],
			['nothing', 'Nothing'],
		],
		sound: [
			['none None', 'None'],
			['0 default', 'Default'],
			['chime', 'Chime'],
		],
	},
	formHasUnsavedChanges: false,
};
