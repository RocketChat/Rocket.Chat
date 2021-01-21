import { createHash } from 'crypto';

import { Db } from 'mongodb';

import { NpsRaw } from '../../../app/models/server/raw/Nps';
import { NpsVoteRaw } from '../../../app/models/server/raw/NpsVote';
import { SettingsRaw } from '../../../app/models/server/raw/Settings';
import { NPSStatus, INpsVoteStatus } from '../../../definition/INps';
import { INPSService, NPSVotePayload, NPSCreatePayload } from '../../sdk/types/INPSService';
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

	async create(nps: NPSCreatePayload): Promise<boolean> {
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

		const { result } = await this.Nps.save({
			_id: npsId,
			startAt,
			expireAt,
			createdBy,
			status: NPSStatus.OPEN,
		});
		if (!result) {
			throw new Error('Error creating NPS');
		}

		return true;
	}

	async sendResults(): Promise<void> {
		const optOut = await this.Settings.getValueById('NPS_opt_out');
		if (optOut) {
			return;
		}

		const nps = await this.Nps.getOpenExpiredAndStartSending();
		if (!nps) {
			return;
		}

		const query = {
			npsId: nps._id,
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

		// TODO send to cloud
		console.log('payload', payload);
	}

	async vote({
		userId,
		npsId,
		roles,
		score,
		comment,
	}: NPSVotePayload): Promise<void> {
		const optOut = await this.Settings.getValueById('NPS_opt_out');
		if (optOut) {
			return;
		}

		const nps = await this.Nps.findOneById(npsId, { projection: { status: 1, startAt: 1, expireAt: 1 } });
		if (!nps) {
			return;
		}

		if (nps.status !== NPSStatus.OPEN) {
			throw new Error('NPS not open for votes');
		}

		const today = new Date();
		if (today > nps.expireAt) {
			throw new Error('NPS expired');
		}

		if (today < nps.startAt) {
			throw new Error('NPS survey not started');
		}

		const identifier = createHash('sha256').update(`${ userId }${ npsId }`).digest('hex');

		const result = await this.NpsVote.insertOne({
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
	}
}
