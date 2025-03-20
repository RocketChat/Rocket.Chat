import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useState } from 'react';

import DeleteTeamChannels from './DeleteTeamChannels';
import DeleteTeamConfirmation from './DeleteTeamConfirmation';

const STEPS = { LIST_ROOMS: 'LIST_ROOMS', CONFIRM_DELETE: 'CONFIRM_DELETE' };

type DeleteTeamModalProps = {
	onCancel: () => void;
	onConfirm: (roomsToDelete: IRoom['_id'][]) => void;
	rooms: Serialized<IRoom>[];
};

const DeleteTeamModal = ({ onCancel, onConfirm, rooms }: DeleteTeamModalProps) => {
	const hasRooms = rooms && rooms.length > 0;

	const [step, setStep] = useState(hasRooms ? STEPS.LIST_ROOMS : STEPS.CONFIRM_DELETE);
	const [deletedRooms, setDeletedRooms] = useState<{ [key: string]: Serialized<IRoom> }>({});
	const [keptRooms, setKeptRooms] = useState<{ [key: string]: Serialized<IRoom> }>({});

	const onChangeRoomSelection = useEffectEvent((room: Serialized<IRoom>) => {
		if (deletedRooms[room._id]) {
			setDeletedRooms((deletedRooms) => {
				delete deletedRooms[room._id];
				return { ...deletedRooms };
			});
			return;
		}
		setDeletedRooms((deletedRooms) => ({ ...deletedRooms, [room._id]: room }));
	});

	const onToggleAllRooms = useEffectEvent(() => {
		if (Object.values(deletedRooms).filter(Boolean).length === 0) {
			return setDeletedRooms(Object.fromEntries(rooms.map((room) => [room._id, room])));
		}
		setDeletedRooms({});
	});

	const onSelectRooms = useEffectEvent(() => {
		const keptRooms = Object.fromEntries(rooms.filter((room) => !deletedRooms[room._id]).map((room) => [room._id, room]));
		setKeptRooms(keptRooms);
		setStep(STEPS.CONFIRM_DELETE);
	});

	if (step === STEPS.CONFIRM_DELETE) {
		return (
			<DeleteTeamConfirmation
				onConfirm={onConfirm}
				onReturn={hasRooms ? () => setStep(STEPS.LIST_ROOMS) : undefined}
				onCancel={onCancel}
				deletedRooms={deletedRooms}
				keptRooms={keptRooms}
			/>
		);
	}

	return (
		<DeleteTeamChannels
			rooms={rooms}
			onCancel={onCancel}
			selectedRooms={deletedRooms}
			onToggleAllRooms={onToggleAllRooms}
			onConfirm={onSelectRooms}
			onChangeRoomSelection={onChangeRoomSelection}
		/>
	);
};

export default DeleteTeamModal;
