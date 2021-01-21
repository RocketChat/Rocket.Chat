import { Db } from 'mongodb';

import { NpsRaw } from '../../../app/models/server/raw/Nps';
import { NpsVoteRaw } from '../../../app/models/server/raw/NpsVote';
import { SettingsRaw } from '../../../app/models/server/raw/Settings';
import { INpsStatus, INpsVoteStatus } from '../../../definition/INps';
import { IUser } from '../../../definition/IUser';
import { INPSService } from '../../sdk/types/INPSService';
import { ServiceClass } from '../../sdk/types/ServiceClass';

export class NPSService extends ServiceClass implements INPSService {
	protected name = 'nps';

	private Nps: NpsRaw;

	private Settings: SettingsRaw;

	private NpsVote: NpsVoteRaw;

	constructor(db: Db) {
		super();

		this.Nps = new NpsRaw(db.collection('rocketchat_nps'));
		this.NpsVote = new NpsVoteRaw(db.collection('rocketchat_nps_vote'));
		this.Settings = new SettingsRaw(db.collection('rocketchat_settings'));
	}

	async create(nps: { npsId: string; startAt: Date; expireAt: Date; createdBy: Pick<IUser, '_id' | 'username'> }): Promise<boolean> {
		const optOut = await this.Settings.getValueById('NPS_opt_out');
		if (optOut) {
			throw new Error('Server opted-out for NPS surveys');
		}

		const {
			npsId,
			startAt,
			expireAt,
			createdBy,
		} = nps;

		const { result } = await this.Nps.updateOne({
			_id: npsId,
		}, {
			$set: {
				startAt,
				_updatedAt: new Date(),
			},
			$setOnInsert: {
				expireAt,
				createdBy,
				createdAt: new Date(),
				status: INpsStatus.NEW,
			},
		}, {
			upsert: true,
		});

		if (!result) {
			throw new Error('Error creating NPS');
		}

		return true;
	}

	async sendResults(npsId: string): Promise<boolean> {
		await this.Nps.updateOne({
			_id: npsId,
			status: INpsStatus.IN_PROGRESS,
		}, {
			$set: {
				status: INpsStatus.SENDING,
			},
		});

		const query = {
			npsId,
			status: INpsVoteStatus.NEW,
		};
		const votes = await this.NpsVote
			.find(query)
			.sort({ ts: 1 })
			.limit(1000)
			.toArray();

		const sending = await Promise.all(votes.map(async (vote) => this.NpsVote.col.findOneAndUpdate({
			_id: vote._id,
			status: INpsVoteStatus.NEW,
		}, {
			$set: {
				status: INpsVoteStatus.SENDING,
			},
		})));

		const payload = {
			votes: sending.filter(Boolean),
		};

		console.log('payload', payload);

		return true;
	}
}
