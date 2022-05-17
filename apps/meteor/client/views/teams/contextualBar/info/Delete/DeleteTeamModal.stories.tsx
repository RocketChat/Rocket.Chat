import { action } from '@storybook/addon-actions';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import DeleteTeamModal from '.';
import StepOne from './StepOne';
import StepTwo from './StepTwo';

export default {
	title: 'Teams/Contextual Bar/DeleteTeamModal',
	component: DeleteTeamModal,
	parameters: {
		layout: 'fullscreen',
	},
} as ComponentMeta<typeof DeleteTeamModal>;

export const Default: ComponentStory<typeof DeleteTeamModal> = (args) => <DeleteTeamModal {...args} />;
Default.storyName = 'DeleteTeamModal';
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
	deletedRooms: Array.from({ length: 15 }).map((_, i) => ({
		rid: i,
		fname: `Room #${i}`,
		name: `room-${i}`,
		usersCount: 10 * i,
		type: 'p',
		t: 'p',
	})),
	keptRooms: Array.from({ length: 15 }).map((_, i) => ({
		rid: i,
		fname: `Room #${i}`,
		name: `room-${i}`,
		usersCount: 10 * i,
		type: 'p',
		t: 'p',
	})),
	onConfirm: action('onConfirm'),
	onCancel: action('onCancel'),
	onReturn: action('onReturn'),
};
