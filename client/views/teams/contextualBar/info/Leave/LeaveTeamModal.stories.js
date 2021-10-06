import React from 'react';

import LeaveTeamModal, { StepOne, StepTwo } from '.';

export default {
	title: 'teams/LeaveTeamModal',
	component: LeaveTeamModal,
};

const commonProps = {
	onConfirm: () => {},
	onCancel: () => {},
};

const rooms = Array.from({ length: 15 }).map((_, i) => ({
	rid: i,
	fname: i,
	name: i,
	usersCount: 10 * i,
	type: 'p',
	t: 'p',
}));

export const Default = () => <LeaveTeamModal rooms={rooms} />;

export const ModalStepOne = () => <StepOne rooms={rooms} selectedRooms={{}} {...commonProps} />;

export const ModalStepTwo = () => <StepTwo {...commonProps} />;
