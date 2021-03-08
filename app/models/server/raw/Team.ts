import { Collection } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { ITeam } from '../../../../definition/ITeam';

type T = ITeam;
export class TeamRaw extends BaseRaw<T> {
	constructor(
		public readonly col: Collection<T>,
		public readonly trash?: Collection<T>,
	) {
		super(col, trash);

		// this.col.createIndexes([
		// 	{ key: { status: 1, expireAt: 1 } },
		// ]);
	}
}
