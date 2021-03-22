import React, { useState } from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import StepOne from './StepOne';
import StepTwo from './StepTwo';
import StepThree from './StepThree';

export const DeleteTeamModal = ({ onCancel, onConfirm, rooms }) => {
	const [step, setStep] = useState(1);
	const [deletedRooms, setDeletedRooms] = useState({});
	const [keptRooms, setKeptRooms] = useState({});

	const onContinue = useMutableCallback(() => setStep(step + 1));

	const onReturn = useMutableCallback(() => setStep(step - 1));

	const onChangeRoomSelection = useMutableCallback((room) => {
		if (deletedRooms[room.rid]) {
			setDeletedRooms((deletedRooms) => ({ ...deletedRooms, [room.rid]: undefined }));
			return;
		}
		setDeletedRooms((deletedRooms) => ({ ...deletedRooms, [room.rid]: room }));
	});

	const onToggleAllRooms = useMutableCallback(() => {
		if (Object.values(deletedRooms).filter(Boolean).length === 0) {
			return setDeletedRooms(Object.fromEntries(rooms.map((room) => [room.rid, room])));
		}
		setDeletedRooms({});
	});

	const onSelectRooms = useMutableCallback(() => {
		const keptRooms = Object.fromEntries(rooms.filter((room) => !deletedRooms.includes(room.rid)).map((room) => [room.rid, room]));
		setKeptRooms(keptRooms);
		onContinue();
	});

	if (step === 2) {
		return <StepTwo
			rooms={rooms}
			onCancel={onCancel}
			params={{}}
			selectedRooms={deletedRooms}
			onToggleAllRooms={onToggleAllRooms}
			onChangeParams={(...args) => console.log(args)}
			onConfirm={onSelectRooms}
			onChangeRoomSelection={onChangeRoomSelection}
		/>;
	}

	if (step === 3) {
		return <StepThree
			onConfirm={onConfirm}
			onCancel={onReturn}
			deletedRooms={deletedRooms}
			keptRooms={keptRooms}
		/>;
	}

	return <StepOne onConfirm={onContinue} onCancel={onCancel} />;
};

export { StepOne, StepTwo, StepThree };

export default DeleteTeamModal;
