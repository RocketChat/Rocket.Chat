import { Collection } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { ITeamMember } from '../../../../definition/ITeam';

type T = ITeamMember;
export class TeamMemberRaw extends BaseRaw<T> {
	constructor(
		public readonly col: Collection<T>,
		public readonly trash?: Collection<T>,
	) {
		super(col, trash);

		this.col.createIndexes([
			{ key: { teamId: 1 } },
		]);
	}
}
