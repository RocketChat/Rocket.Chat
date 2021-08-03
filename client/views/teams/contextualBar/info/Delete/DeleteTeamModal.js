import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState, useCallback } from 'react';

import { StepOne, StepTwo } from '.';

const STEPS = { LIST_ROOMS: 'LIST_ROOMS', CONFIRM_DELETE: 'CONFIRM_DELETE' };

export const DeleteTeamModal = ({ onCancel, onConfirm, rooms }) => {
	const hasRooms = rooms?.length > 0;

	const [step, setStep] = useState(hasRooms ? STEPS.LIST_ROOMS : STEPS.CONFIRM_DELETE);
	const [deletedRooms, setDeletedRooms] = useState({});
	const [keptRooms, setKeptRooms] = useState({});

	const onContinue = useCallback(() => {
		setStep(STEPS.CONFIRM_DELETE);
	}, [setStep]);

	const onReturn = useCallback(() => {
		setStep(STEPS.LIST_ROOMS);
	}, [setStep]);

	const onChangeRoomSelection = useMutableCallback((room) => {
		if (deletedRooms[room._id]) {
			setDeletedRooms((deletedRooms) => {
				delete deletedRooms[room._id];
				return { ...deletedRooms };
			});
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
		const keptRooms = Object.fromEntries(
			rooms.filter((room) => !deletedRooms[room._id]).map((room) => [room._id, room]),
		);
		setKeptRooms(keptRooms);
		onContinue();
	});

	if (step === STEPS.CONFIRM_DELETE) {
		return (
			<StepTwo
				onConfirm={onConfirm}
				onReturn={hasRooms && onReturn}
				onCancel={onCancel}
				deletedRooms={deletedRooms}
				keptRooms={keptRooms}
			/>
		);
	}

	return (
		<StepOne
			rooms={rooms}
			onCancel={onCancel}
			params={{}}
			selectedRooms={deletedRooms}
			onToggleAllRooms={onToggleAllRooms}
			onChangeParams={(...args) => console.log(args)}
			onConfirm={onSelectRooms}
			onChangeRoomSelection={onChangeRoomSelection}
		/>
	);
};

export default DeleteTeamModal;
