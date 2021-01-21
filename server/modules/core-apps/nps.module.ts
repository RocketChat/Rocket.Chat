import { createHash } from 'crypto';

import { Db } from 'mongodb';

import { IUiKitCoreApp } from '../../sdk/types/IUiKitCoreApp';
import { NpsVoteRaw } from '../../../app/models/server/raw/NpsVote';
import { INpsVoteStatus } from '../../../definition/INps';

export class Nps implements IUiKitCoreApp {
	appId = 'nps-core';

	private NpsModel: NpsVoteRaw;

	constructor(private db: Db) {
		this.NpsModel = new NpsVoteRaw(this.db.collection('rocketchat_nps_vote'));
	}

	async blockAction(payload: any): Promise<any> {
		console.log('blockAction ->', payload);

		// TODO use correct payload from uikit
		const {
			payload: {
				score,
				comment,
				npsId,
			},
			user: {
				_id: userId,
				roles,
			},
		} = payload;

		const identifier = createHash('sha256').update(userId).digest('hex');

		const result = await this.NpsModel.insertOne({
			ts: new Date(),
			npsId,
			identifier,
			roles,
			score,
			comment,
			status: INpsVoteStatus.NEW,
			_updatedAt: new Date(),
		});
		if (!result) {
			throw new Error('Error saving NPS vote');
		}

		return true;
	}
}
