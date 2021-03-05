import React from 'react';

import { StepOne, StepTwo, StepThree, DeleteTeam } from './DeleteTeamModal';

export default {
	title: 'components/DeleteTeamModal',
	component: StepOne,
};

const commonProps = {
	onConfirm: () => {},
	onCancel: () => {},
};

const rooms = Array.from({ length: 15 }).map((_, i) => ({ rid: i, fname: i, name: i, usersCount: 10 * i, type: 'p', t: 'p' }));

export const Default = () => <DeleteTeam rooms={rooms}/>;

export const ModalStepOne = () => <StepOne
	{...commonProps}
/>;

export const ModalStepTwo = () => <StepTwo
	rooms={rooms}
	{...commonProps}
/>;

export const ModalStepThree = () => <StepThree
	deletedRooms={rooms}
	keptRooms={rooms}
	{...commonProps}
/>;
