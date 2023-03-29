import { action } from '@storybook/addon-actions';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import LeaveTeamModal from './LeaveTeamModal';
import LeaveTeamModalChannels from './LeaveTeamModalChannels';
import LeaveTeamModalConfirmation from './LeaveTeamModalConfirmation';

export default {
	title: 'Teams/Contextual Bar/LeaveTeamModal',
	component: LeaveTeamModal,
	parameters: {
		layout: 'fullscreen',
	},
} as ComponentMeta<typeof LeaveTeamModal>;

export const ChannelsStep: ComponentStory<typeof LeaveTeamModalChannels> = (args) => <LeaveTeamModalChannels {...args} />;
ChannelsStep.storyName = 'LeaveTeamModalChannels';
ChannelsStep.args = {
	rooms: Array.from({ length: 15 }).map((_, i) => ({
		_id: `${i}`,
		fname: `Room #${i}`,
		name: `room-${i}`,
		usersCount: 10 * i,
		type: 'p',
		t: 'p',
		isLastOwner: false,
		msgs: 10,
		u: {
			_id: 'user',
		},
		autoTranslateLanguage: 'english',
		_updatedAt: '2022-02-02 09:00',
	})),
	selectedRooms: {},
	onConfirm: action('onConfirm'),
	onCancel: action('onCancel'),
	onChangeRoomSelection: action('onChangeRoomSelection'),
	onToggleAllRooms: action('onToggleAllRooms'),
};

export const ConfirmationStep: ComponentStory<typeof LeaveTeamModalConfirmation> = (args) => <LeaveTeamModalConfirmation {...args} />;
ConfirmationStep.storyName = 'StepTwo';
ConfirmationStep.args = {
	onConfirm: action('onConfirm'),
	onCancel: action('onCancel'),
	onClose: action('onClose'),
};
