import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useUserId } from '@rocket.chat/ui-contexts';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import GenericModalSkeleton from '../../../../../components/GenericModal/GenericModalSkeleton';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../../lib/asyncState';
import ConvertToChannelConfirmation from './ConvertToChannelModal/ConvertToChannelConfirmation';
import ConvertToChannelList from './ConvertToChannelModal/ConvertToChannelList';

type ConvertToChannelModalProps = {
	onClose?: () => void;
	onCancel: () => void;
	onConfirm: (roomsToRemove: { [key: string]: Serialized<IRoom> }) => Promise<void>;
	teamId: string;
};

const STEPS = {
	LIST_ROOMS: 'LIST_ROOMS',
	CONFIRM_CONVERT: 'CONFIRM_CONVERT',
};

// TODO: replace useEndpointData
const ConvertToChannelModal = ({ onCancel, onClose = onCancel, onConfirm, teamId }: ConvertToChannelModalProps) => {
	const userId = useUserId();

	if (!userId) {
		throw Error('No user found');
	}

	const { value, phase } = useEndpointData('/v1/teams.listRoomsOfUser', {
		params: useMemo(() => ({ teamId, userId, canUserDelete: 'true' }), [teamId, userId]),
	});

	const [step, setStep] = useState(STEPS.LIST_ROOMS);
	const [selectedRooms, setSelectedRooms] = useState<{ [key: string]: Serialized<IRoom> }>({});

	const onContinue = useEffectEvent(() => setStep(STEPS.CONFIRM_CONVERT));
	const onReturn = useEffectEvent(() => setStep(STEPS.LIST_ROOMS));

	useEffect(() => {
		if (value?.rooms?.length === 0) {
			return setStep(STEPS.CONFIRM_CONVERT);
		}
	}, [value?.rooms?.length]);

	const onChangeRoomSelection = useCallback((room) => {
		setSelectedRooms((selectedRooms) => {
			if (selectedRooms[room._id]) {
				delete selectedRooms[room._id];
				return { ...selectedRooms };
			}
			return { ...selectedRooms, [room._id]: room };
		});
	}, []);

	const onToggleAllRooms = useEffectEvent(() => {
		if (Object.values(selectedRooms).filter(Boolean).length === 0 && value?.rooms) {
			return setSelectedRooms(Object.fromEntries(value?.rooms.map((room) => [room._id, room])));
		}
		setSelectedRooms({});
	});

	if (phase === AsyncStatePhase.LOADING) {
		return <GenericModalSkeleton onClose={onClose} />;
	}

	if (step === STEPS.CONFIRM_CONVERT) {
		return (
			<ConvertToChannelConfirmation
				onConfirm={onConfirm}
				onClose={onClose}
				onCancel={value?.rooms && value?.rooms.length > 0 ? onReturn : onCancel}
				roomsToRemove={selectedRooms}
				rooms={value?.rooms}
			/>
		);
	}

	return (
		<ConvertToChannelList
			onConfirm={onContinue}
			onClose={onClose}
			onCancel={onCancel}
			rooms={value?.rooms}
			selectedRooms={selectedRooms}
			onToggleAllRooms={onToggleAllRooms}
			onChangeRoomSelection={onChangeRoomSelection}
			eligibleRoomsLength={value?.rooms?.length}
		/>
	);
};

export default ConvertToChannelModal;
