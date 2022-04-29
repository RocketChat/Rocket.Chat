import { action } from '@storybook/addon-actions';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import LeaveTeamModal, { StepOne, StepTwo } from '.';

export default {
	title: 'Teams/Contextual Bar/LeaveTeamModal',
	component: LeaveTeamModal,
	parameters: {
		layout: 'fullscreen',
	},
} as ComponentMeta<typeof LeaveTeamModal>;

export const Default: ComponentStory<typeof LeaveTeamModal> = (args) => <LeaveTeamModal {...args} />;
Default.storyName = 'LeaveTeamModal';
Default.args = {
	teamId: '123',
	onConfirm: action('onConfirm'),
	onCancel: action('onCancel'),
};

export const ModalStepOne: ComponentStory<typeof StepOne> = (args) => <StepOne {...args} />;
ModalStepOne.storyName = 'StepOne';
ModalStepOne.args = {
	rooms: Array.from({ length: 15 }).map((_, i) => ({
		rid: i,
		fname: `Room #${i}`,
		name: `room-${i}`,
		usersCount: 10 * i,
		type: 'p',
		t: 'p',
	})),
	selectedRooms: {},
	onConfirm: action('onConfirm'),
	onCancel: action('onCancel'),
	onChangeRoomSelection: action('onChangeRoomSelection'),
	onToggleAllRooms: action('onToggleAllRooms'),
};

export const ModalStepTwo: ComponentStory<typeof StepTwo> = (args) => <StepTwo {...args} />;
ModalStepTwo.storyName = 'StepTwo';
ModalStepTwo.args = {
	onConfirm: action('onConfirm'),
	onCancel: action('onCancel'),
	onClose: action('onClose'),
};
