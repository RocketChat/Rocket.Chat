import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState } from 'react';

import RemoveUsersFirstStep from './RemoveUsersFirstStep';
import RemoveUsersSecondStep from './RemoveUsersSecondStep';

const STEPS = {
	LIST_ROOMS: 'LIST_ROOMS',
	CONFIRM_DELETE: 'CONFIRM_DELETE',
};

const RemoveUsersModal = ({
	onClose,
	onCancel,
	onConfirm,
	rooms,
	currentStep = rooms?.length > 0 ? STEPS.LIST_ROOMS : STEPS.CONFIRM_DELETE,
	username,
}) => {
	const [step, setStep] = useState(currentStep);

	const [deletedRooms, setDeletedRooms] = useState({});
	const [keptRooms, setKeptRooms] = useState({});

	const onContinue = useMutableCallback(() => setStep(STEPS.CONFIRM_DELETE));
	const onReturn = useMutableCallback(() => setStep(STEPS.LIST_ROOMS));

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
		const keptRooms = Object.fromEntries(
			rooms.filter((room) => !deletedRooms[room._id]).map((room) => [room._id, room]),
		);
		setKeptRooms(keptRooms);
		onContinue();
	});

	if (step === STEPS.CONFIRM_DELETE) {
		return (
			<RemoveUsersSecondStep
				onConfirm={onConfirm}
				onClose={onClose}
				onCancel={rooms?.length > 0 ? onReturn : onCancel}
				deletedRooms={deletedRooms}
				rooms={rooms}
				keptRooms={keptRooms}
				username={username}
			/>
		);
	}

	return (
		<RemoveUsersFirstStep
			onConfirm={onSelectRooms}
			onClose={onClose}
			onCancel={onCancel}
			rooms={rooms}
			params={{}}
			selectedRooms={deletedRooms}
			onToggleAllRooms={onToggleAllRooms}
			// onChangeParams={(...args) => console.log(args)}
			onChangeRoomSelection={onChangeRoomSelection}
			eligibleRoomsLength={rooms?.length}
		/>
	);
};

export default RemoveUsersModal;
