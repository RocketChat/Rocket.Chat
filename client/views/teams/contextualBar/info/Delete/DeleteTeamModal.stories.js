import React from 'react';

import DeleteTeam, { StepOne, StepTwo } from '.';

export default {
	title: 'teams/DeleteTeamModal',
	component: DeleteTeam,
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

export const Default = () => <DeleteTeam rooms={rooms} />;

export const ModalStepOne = () => <StepOne rooms={rooms} selectedRooms={{}} {...commonProps} />;

export const ModalStepTwo = () => (
	<StepTwo deletedRooms={rooms} keptRooms={rooms} {...commonProps} />
);
