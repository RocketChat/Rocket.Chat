import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { usePermission } from '@rocket.chat/ui-contexts';
import { useState, useCallback } from 'react';

import RemoveUsersFirstStep from './RemoveUsersFirstStep';
import RemoveUsersSecondStep from './RemoveUsersSecondStep';

const STEPS = {
	LIST_ROOMS: 'LIST_ROOMS',
	CONFIRM_DELETE: 'CONFIRM_DELETE',
};

type BaseRemoveUsersModalProps = {
	onClose: () => void;
	onCancel: () => void;
	onConfirm: (deletedRooms: { [key: string]: Serialized<IRoom> }) => void;
	currentStep?: string;
	rooms?: (Serialized<IRoom> & { isLastOwner?: boolean })[];
	username?: string;
};

const BaseRemoveUsersModal = ({
	onClose,
	onCancel,
	onConfirm,
	rooms,
	currentStep = rooms?.length === 0 ? STEPS.CONFIRM_DELETE : STEPS.LIST_ROOMS,
	username,
}: BaseRemoveUsersModalProps) => {
	const [step, setStep] = useState(currentStep);

	const [selectedRooms, setSelectedRooms] = useState<Record<string, Serialized<IRoom> & { isLastOwner?: boolean }>>({});

	const onContinue = useEffectEvent(() => setStep(STEPS.CONFIRM_DELETE));
	const onReturn = useEffectEvent(() => setStep(STEPS.LIST_ROOMS));

	const canViewUserRooms = usePermission('view-all-team-channels');

	const eligibleRooms = rooms?.filter(({ isLastOwner }) => !isLastOwner);

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
		if (Object.values(selectedRooms).filter(Boolean).length === 0) {
			return setSelectedRooms(Object.fromEntries(eligibleRooms?.map((room) => [room._id, room]) ?? []));
		}
		setSelectedRooms({});
	});

	if (step === STEPS.CONFIRM_DELETE || !canViewUserRooms) {
		return (
			<RemoveUsersSecondStep
				onConfirm={onConfirm}
				onClose={onClose}
				onCancel={(rooms?.length ?? 0) > 0 ? onReturn : onCancel}
				deletedRooms={selectedRooms}
				rooms={rooms}
				username={username}
			/>
		);
	}

	return (
		<RemoveUsersFirstStep
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

export default BaseRemoveUsersModal;
