import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState, useCallback } from 'react';

import { StepOne, StepTwo } from '.';

export const LeaveRoomModal = ({ onCancel, onConfirm, rooms }) => {
	const [step, setStep] = useState(1);
	const [selectedRooms, setSelectedRooms] = useState({});
	const [keptRooms, setKeptRooms] = useState({});

	const lastOwnerRooms = rooms.filter(({ isLastOwner }) => isLastOwner);

	const onContinue = useCallback(() => setStep((step) => step + 1), []);

	const onReturn = useCallback(() => setStep((step) => step - 1), []);

	const onChangeRoomSelection = useCallback((room) => {
		setSelectedRooms((selectedRooms) => {
			if (selectedRooms[room._id]) {
				return { ...selectedRooms, [room._id]: undefined };
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

	const onSelectRooms = useMutableCallback(() => {
		const keptRooms = Object.fromEntries(
			rooms.filter((room) => !selectedRooms[room._id]).map((room) => [room._id, room]),
		);
		setKeptRooms(keptRooms);
		onContinue();
	});

	if (rooms.length === 0 || step === 2) {
		return (
			<StepTwo
				onConfirm={() => onConfirm(selectedRooms)}
				onCancel={rooms.length > 1 && onReturn}
				onClose={onCancel}
				lastOwnerRooms={Object.fromEntries(lastOwnerRooms.map((room) => [room._id, room]))}
				keptRooms={keptRooms}
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
			onConfirm={onSelectRooms}
			onChangeRoomSelection={onChangeRoomSelection}
		/>
	);
};

export default LeaveRoomModal;
