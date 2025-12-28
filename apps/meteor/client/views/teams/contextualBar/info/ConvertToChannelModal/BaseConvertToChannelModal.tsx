import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useState, useCallback } from 'react';

import FirstStep from './ModalSteps/FirstStep';
import SecondStep from './ModalSteps/SecondStep';

const STEPS = {
	LIST_ROOMS: 'LIST_ROOMS',
	CONFIRM_CONVERT: 'CONFIRM_CONVERT',
};

type BaseConvertToChannelModalProps = {
	onClose: () => void;
	onCancel: () => void;
	onConfirm: (deletedRooms: { [key: string]: Serialized<IRoom> }) => void;
	currentStep?: string;
	rooms?: (Serialized<IRoom> & { isLastOwner?: boolean })[];
};

const BaseConvertToChannelModal = ({
	onClose,
	onCancel,
	onConfirm,
	rooms,
	currentStep = rooms?.length === 0 ? STEPS.CONFIRM_CONVERT : STEPS.LIST_ROOMS,
}: BaseConvertToChannelModalProps) => {
	const [step, setStep] = useState(currentStep);
	const [selectedRooms, setSelectedRooms] = useState<{ [key: string]: Serialized<IRoom> }>({});

	const onContinue = useEffectEvent(() => setStep(STEPS.CONFIRM_CONVERT));
	const onReturn = useEffectEvent(() => setStep(STEPS.LIST_ROOMS));

	const eligibleRooms = rooms;

	const onChangeRoomSelection = useCallback((room: Serialized<IRoom>) => {
		setSelectedRooms((selectedRooms) => {
			if (selectedRooms[room._id]) {
				delete selectedRooms[room._id];
				return { ...selectedRooms };
			}
			return { ...selectedRooms, [room._id]: room };
		});
	}, []);

	const onToggleAllRooms = useEffectEvent(() => {
		if (Object.values(selectedRooms).filter(Boolean).length === 0 && eligibleRooms) {
			return setSelectedRooms(Object.fromEntries(eligibleRooms.map((room) => [room._id, room])));
		}
		setSelectedRooms({});
	});

	if (step === STEPS.CONFIRM_CONVERT) {
		return (
			<SecondStep
				onConfirm={onConfirm}
				onClose={onClose}
				onCancel={rooms && rooms.length > 0 ? onReturn : onCancel}
				deletedRooms={selectedRooms}
				rooms={rooms}
			/>
		);
	}

	return (
		<FirstStep
			onConfirm={onContinue}
			onClose={onClose}
			onCancel={onCancel}
			rooms={rooms}
			selectedRooms={selectedRooms}
			onToggleAllRooms={onToggleAllRooms}
			onChangeRoomSelection={onChangeRoomSelection}
			eligibleRoomsLength={eligibleRooms?.length}
		/>
	);
};

export default BaseConvertToChannelModal;
