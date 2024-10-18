import type { ITeam } from '@rocket.chat/core-typings';
import { TEAM_TYPE } from '@rocket.chat/core-typings';
import { useUserSubscription } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { HeaderTag, HeaderTagIcon } from '../../../components/Header';
import { goToRoomById } from '../../../lib/utils/goToRoomById';

const ParentTeam = ({ team }: { team: Pick<ITeam, 'name' | 'roomId' | 'type'> }): ReactElement | null => {
	const isTeamPublic = team.type === TEAM_TYPE.PUBLIC;

	const subscription = useUserSubscription(team.roomId);

	const redirectToMainRoom = (): void => {
		const rid = team.roomId;
		if (!rid) {
			return;
		}

		const isTeamPublic = team.type === TEAM_TYPE.PUBLIC;

		const userBelongsToTeam = !!subscription;

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
