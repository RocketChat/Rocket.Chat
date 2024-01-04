import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import type { FC } from 'react';
import React, { useMemo } from 'react';

import GenericModalSkeleton from '../../../components/GenericModal/GenericModalSkeleton';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../lib/asyncState';
import BaseConvertToChannelModal from './BaseConvertToChannelModal';

type ConvertToChannelModalProps = {
	onClose: () => void;
	onCancel: () => void;
	onConfirm: () => Serialized<IRoom>[];
	teamId: string;
	userId: string;
};

const ConvertToChannelModal: FC<ConvertToChannelModalProps> = ({ onClose, onCancel, onConfirm, teamId, userId }) => {
	const { value, phase } = useEndpointData('/v1/teams.listRoomsOfUser', {
		params: useMemo(() => ({ teamId, userId, canUserDelete: 'true' }), [teamId, userId]),
	});

	if (phase === AsyncStatePhase.LOADING) {
		return <GenericModalSkeleton onClose={onClose} />;
	}

	return <BaseConvertToChannelModal onClose={onClose} onCancel={onCancel} onConfirm={onConfirm} rooms={value?.rooms} />;
};

export default ConvertToChannelModal;
