import type { IRoom } from '@rocket.chat/core-typings';
import { TeamType } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import type { MouseEvent } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { useTeamInfoQuery } from '../../hooks/useTeamInfoQuery';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';

export type RoomHoverCardKindProps = {
	room: IRoom;
	onNavigate: () => void;
};

/** Says what kind of room this is, and which team it belongs to. */
const RoomHoverCardKind = ({ room, onNavigate }: RoomHoverCardKindProps) => {
	const { t } = useTranslation();
	const belongsToTeam = Boolean(room.teamId && !room.teamMain);
	const { data: team } = useTeamInfoQuery(room.teamId ?? '', { enabled: belongsToTeam });

	if (room.teamMain) {
		return <>{t(room.t === 'c' ? 'Teams_Public_Team' : 'Teams_Private_Team')}</>;
	}

	if (room.prid) {
		return <>{t('Discussion')}</>;
	}

	if (room.t === 'd') {
		return <>{t('Direct_Message')}</>;
	}

	if (belongsToTeam && team?.name && team.roomId) {
		const teamRoomType = team.type === TeamType.PUBLIC ? 'c' : 'p';
		const teamRoom = { rid: team.roomId, name: team.name };

		const handleClick = (e: MouseEvent) => {
			e.preventDefault();
			onNavigate();
			roomCoordinator.openRouteLink(teamRoomType, teamRoom);
		};

		return (
			<Trans
				i18nKey={room.t === 'c' ? 'Public_channel_in_team' : 'Private_channel_in_team'}
				values={{ teamName: team.name }}
				components={{
					teamLink: (
						<Box
							is='a'
							href={roomCoordinator.getRouteLink(teamRoomType, teamRoom) || undefined}
							color='font-info'
							fontWeight='bold'
							onClick={handleClick}
						/>
					),
				}}
			/>
		);
	}

	return <>{t(room.t === 'c' ? 'Public_Channel' : 'Private_Channel')}</>;
};

export default RoomHoverCardKind;
