import type { IRoom } from '@rocket.chat/core-typings';
import { useTranslation } from 'react-i18next';

import ParentRoomButton from './ParentRoomButton';
import { useRoomHeaderActions } from '../RoomHeaderActionsContext';
import { useParentTeam } from './hooks/useParentTeam';

export type ParentTeamProps = {
	room: IRoom;
};

const ParentTeam = ({ room }: ParentTeamProps) => {
	const { t } = useTranslation();
	const { teamId } = room;

	if (!teamId) {
		throw new Error('invalid rid');
	}

	const { visible, loading, name, mainRoomId } = useParentTeam(teamId);
	const { openRoom } = useRoomHeaderActions();

	if (!visible) {
		return null;
	}

	return (
		<ParentRoomButton
			loading={loading}
			onClick={() => mainRoomId && openRoom(mainRoomId)}
			title={t('Back_to__roomName__team', { roomName: name })}
		/>
	);
};

export default ParentTeam;
