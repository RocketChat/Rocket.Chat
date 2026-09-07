import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { GenericModalSkeleton } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import BaseConvertToChannelModal from './BaseConvertToChannelModal';
import { teamsQueryKeys } from '../../../../../lib/queryKeys';

export type ConvertToChannelModalProps = {
	onClose: () => void;
	onCancel: () => void;
	onConfirm: (deletedRooms: { [key: string]: Serialized<IRoom> }) => void;
	teamId: string;
	userId: string;
	/** The team's main room, so the confirmation can warn about losing its ABAC attributes. */
	teamRoom?: Pick<IRoom, 'abacAttributes'>;
};

const ConvertToChannelModal = ({ onClose, onCancel, onConfirm, teamId, userId, teamRoom }: ConvertToChannelModalProps) => {
	const listRoomsOfUser = useEndpoint('GET', '/v1/teams.listRoomsOfUser');
	const { isPending, data } = useQuery({
		queryKey: teamsQueryKeys.roomsOfUser(teamId, userId, { canUserDelete: true }),
		queryFn: () => listRoomsOfUser({ teamId, userId, canUserDelete: 'true' }),
	});

	if (isPending) {
		return <GenericModalSkeleton />;
	}

	return <BaseConvertToChannelModal onClose={onClose} onCancel={onCancel} onConfirm={onConfirm} rooms={data?.rooms} teamRoom={teamRoom} />;
};

export default ConvertToChannelModal;
