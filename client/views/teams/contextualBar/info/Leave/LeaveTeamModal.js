import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState, useCallback } from 'react';

import { StepOne, StepTwo } from '.';

const STEPS = {
	LIST_ROOMS: 'LIST_ROOMS',
	CONFIRM_LEAVE: 'CONFIRM_LEAVE',
};

export const LeaveTeamModal = ({ onCancel, onConfirm, rooms }) => {
	const [step, setStep] = useState(() => {
		if (rooms.length === 0) {
			return STEPS.CONFIRM_LEAVE;
		}
		return STEPS.LIST_ROOMS;
	});
	const [selectedRooms, setSelectedRooms] = useState({});

	const lastOwnerRooms = rooms.filter(({ isLastOwner }) => isLastOwner);

	const onContinue = useCallback(() => setStep(STEPS.CONFIRM_LEAVE), []);

	const onReturn = useCallback(() => setStep(STEPS.LIST_ROOMS), []);

	const onChangeRoomSelection = useCallback((room) => {
		setSelectedRooms((selectedRooms) => {
			if (selectedRooms[room._id]) {
				delete selectedRooms[room._id];
				return { ...selectedRooms };
			}
			return { ...selectedRooms, [room._id]: room };
		});
	}, []);

	const onToggleAllRooms = useMutableCallback(() => {
		setSelectedRooms((selectedRooms) => {
			if (Object.values(selectedRooms).filter(Boolean).length === 0) {
				return Object.fromEntries(
					rooms.filter(({ isLastOwner }) => !isLastOwner).map((room) => [room._id, room]),
				);
			}

			return {};
		});
	});

	if (step === STEPS.CONFIRM_LEAVE) {
		return (
			<StepTwo
				onConfirm={onConfirm}
				onCancel={rooms.length > 0 && onReturn}
				onClose={onCancel}
				rooms={rooms}
			/>
		);
	}

	return (
		<StepOne
			rooms={rooms}
			onCancel={onCancel}
			params={{}}
			eligibleRoomsLength={rooms.length - lastOwnerRooms.length}
			selectedRooms={selectedRooms}
			onToggleAllRooms={onToggleAllRooms}
			onChangeParams={(...args) => console.log(args)}
			onConfirm={onContinue}
			onChangeRoomSelection={onChangeRoomSelection}
		/>
	);
};

export default LeaveTeamModal;
