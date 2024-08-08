import type { ITeam } from '@rocket.chat/core-typings';
import { TEAM_TYPE } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';
import React from 'react';

import { HeaderTag, HeaderTagIcon } from '../../../components/Header';
import { goToRoomById } from '../../../lib/utils/goToRoomById';

const ParentTeam = ({ team }: { team: ITeam }): ReactElement | null => {
	const isTeamPublic = team.type === TEAM_TYPE.PUBLIC;

	const redirectToMainRoom = (): void => {
		const rid = team.roomId;
		if (!rid) {
			return;
		}

		const isTeamPublic = team.type === TEAM_TYPE.PUBLIC;
		// TODO how to know if belongs to team?
		const userBelongsToTeam = false;
		if (!(isTeamPublic || userBelongsToTeam)) {
			return;
		}

		goToRoomById(rid);
	};

	return (
		<HeaderTag
			role='button'
			tabIndex={0}
			onKeyDown={(e) => (e.code === 'Space' || e.code === 'Enter') && redirectToMainRoom()}
			onClick={redirectToMainRoom}
		>
			<HeaderTagIcon icon={{ name: isTeamPublic ? 'team' : 'team-lock' }} />
			{team.name}
		</HeaderTag>
	);
};

export default ParentTeam;
