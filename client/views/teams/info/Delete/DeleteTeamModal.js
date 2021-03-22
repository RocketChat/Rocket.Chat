import React, { useState } from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { StepOne, StepTwo, StepThree } from '.';

export const DeleteTeamModal = ({ onCancel, onConfirm, onClose, rooms }) => {
	const [step, setStep] = useState(1);
	const [deletedRooms, setDeletedRooms] = useState({});
	const [keptRooms, setKeptRooms] = useState({});

	const onContinue = useMutableCallback(() => {
		if (step === 1 && rooms.length === 0) {
			return setStep(3);
		}
		setStep(step + 1);
	});

	const onReturn = useMutableCallback(() => {
		if (step === 3 && rooms.length === 0) {
			return setStep(1);
		}
		setStep(step - 1);
	});

	const onChangeRoomSelection = useMutableCallback((room) => {
		if (deletedRooms[room._id]) {
			setDeletedRooms((deletedRooms) => ({ ...deletedRooms, [room._id]: undefined }));
			return;
		}
		setDeletedRooms((deletedRooms) => ({ ...deletedRooms, [room._id]: room }));
	});

	const onToggleAllRooms = useMutableCallback(() => {
		if (Object.values(deletedRooms).filter(Boolean).length === 0) {
			return setDeletedRooms(Object.fromEntries(rooms.map((room) => [room._id, room])));
		}
		setDeletedRooms({});
	});

	const onSelectRooms = useMutableCallback(() => {
		const keptRooms = Object.fromEntries(rooms.filter((room) => !deletedRooms[room._id]).map((room) => [room._id, room]));
		setKeptRooms(keptRooms);
		onContinue();
	});

	if (step === 2) {
		return <StepTwo
			rooms={rooms}
			onCancel={onCancel}
			onClose={onClose}
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
			onClose={onClose}
			onCancel={onReturn}
			deletedRooms={deletedRooms}
			keptRooms={keptRooms}
		/>;
	}

	return <StepOne onClose={onClose} onConfirm={onContinue} onCancel={onCancel} />;
};


export default DeleteTeamModal;
