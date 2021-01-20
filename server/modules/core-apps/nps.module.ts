import { createHash } from 'crypto';

import { Db } from 'mongodb';

import { IUiKitCoreApp } from '../../sdk/types/IUiKitCoreApp';
import { NpsVoteRaw } from '../../../app/models/server/raw/NpsVote';

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
			score,
			comment,
			user: {
				_id: userId,
			},
		} = payload;

		const identifier = createHash('sha256').update(userId).digest('hex');

		const result = await this.NpsModel.insertOne({
			ts: new Date(),
			score,
			comment,
			identifier,
		});

		return { result };
	}
}
