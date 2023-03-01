import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { ReactElement } from 'react';
import React, { useState, useCallback, useMemo } from 'react';

import LeaveTeamModalChannels from './LeaveTeamModalChannels';
import LeaveTeamModalConfirmation from './LeaveTeamModalConfirmation';

export const LEAVE_TEAM_STEPS = {
	LIST_ROOMS: 'LIST_ROOMS',
	CONFIRM_LEAVE: 'CONFIRM_LEAVE',
};

type LeaveTeamModalProps = {
	rooms: (Serialized<IRoom> & { isLastOwner?: boolean })[];
	onCancel: () => void;
	onConfirm: () => void;
};

const LeaveTeamModal = ({ rooms, onCancel, onConfirm }: LeaveTeamModalProps): ReactElement => {
	const memoizedRooms = useMemo(() => rooms, [rooms]);
	const [step, setStep] = useState(memoizedRooms.length === 0 ? LEAVE_TEAM_STEPS.CONFIRM_LEAVE : LEAVE_TEAM_STEPS.LIST_ROOMS);

	const [selectedRooms, setSelectedRooms] = useState<{ [key: string]: Serialized<IRoom> & { isLastOwner?: boolean } }>({});
	const lastOwnerRooms = rooms.filter(({ isLastOwner }) => isLastOwner);

	const handleContinue = useCallback(() => setStep(LEAVE_TEAM_STEPS.CONFIRM_LEAVE), []);
	const handleReturn = useCallback(() => setStep(LEAVE_TEAM_STEPS.LIST_ROOMS), []);

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
				return Object.fromEntries(rooms.filter(({ isLastOwner }) => !isLastOwner).map((room) => [room._id, room]));
			}

			return {};
		});
	});

	if (step === LEAVE_TEAM_STEPS.CONFIRM_LEAVE) {
		return (
			<LeaveTeamModalConfirmation
				selectedRooms={selectedRooms}
				onConfirm={onConfirm}
				onClose={onCancel}
				onCancel={rooms.length > 0 ? handleReturn : undefined}
			/>
		);
	}

	return (
		<LeaveTeamModalChannels
			rooms={rooms}
			onCancel={onCancel}
			eligibleRoomsLength={rooms.length - lastOwnerRooms.length}
			selectedRooms={selectedRooms}
			onToggleAllRooms={onToggleAllRooms}
			onConfirm={handleContinue}
			onChangeRoomSelection={onChangeRoomSelection}
		/>
	);
};

export default LeaveTeamModal;
