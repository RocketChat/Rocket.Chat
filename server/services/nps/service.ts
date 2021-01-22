import { createHash } from 'crypto';

import { Db } from 'mongodb';

import { NpsRaw } from '../../../app/models/server/raw/Nps';
import { NpsVoteRaw } from '../../../app/models/server/raw/NpsVote';
import { SettingsRaw } from '../../../app/models/server/raw/Settings';
import { NPSStatus, INpsVoteStatus, INpsVote } from '../../../definition/INps';
import { BannerPlatform } from '../../../definition/IBanner';
import { INPSService, NPSVotePayload, NPSCreatePayload } from '../../sdk/types/INPSService';
import { ServiceClass } from '../../sdk/types/ServiceClass';
import { Banner, NPS } from '../../sdk';
import { sendToCloud } from './sendToCloud';

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
		const npsEnabled = await this.Settings.getValueById('NPS_survey_enabled');
		if (!npsEnabled) {
			throw new Error('Server opted-out for NPS surveys');
		}

		const any = await this.Nps.findOne({}, { projection: { _id: 1 } });
		if (!any) {
			const today = new Date();
			const inTwoMonths = new Date();
			inTwoMonths.setMonth(inTwoMonths.getMonth() + 2);

			Banner.create({
				platform: [BannerPlatform.Web],
				createdAt: today,
				expireAt: inTwoMonths,
				startAt: today,
				roles: ['admin'],
				createdBy: {
					_id: 'rocket.cat',
					username: 'rocket.cat',
				},
				_updatedAt: new Date(),
				view: {
					blocks: [
						{
							type: 'section',
							blockId: 'attention',
							text: {
								type: 'plain_text',
								text: `NPS survey is scheduled to run at ${ inTwoMonths } for all users. It\'s possible to turn off the survey on 'Admin > General > NPS'?`,
								emoji: false,
							},
						},
					],
				},
			});
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
		const npsEnabled = await this.Settings.getValueById('NPS_survey_enabled');
		if (!npsEnabled) {
			return;
		}

		const npsSending = await this.Nps.getOpenExpiredAlreadySending();
		console.log('npsSending ->', npsSending);

		const nps = npsSending || await this.Nps.getOpenExpiredAndStartSending();
		console.log('nps ->', nps);
		if (!nps) {
			return;
		}

		const total = await this.NpsVote.findByNpsId(nps._id).count();
		console.log('total ->', total);

		const votesToSend = await this.NpsVote.findNotSentByNpsId(nps._id).toArray();
		console.log('votesToSend ->', votesToSend);

		// if there is nothing to sent, check if something gone wrong
		if (votesToSend.length === 0) {
			// update old votes (sent 5 minutes ago or more) in 'sending' status back to 'new'
			await this.NpsVote.updateOldSendingToNewByNpsId(nps._id);

			NPS.sendResults();
			return;
		}

		const today = new Date();

		const sending = await Promise.all(votesToSend.map(async (vote) => {
			const { value } = await this.NpsVote.col.findOneAndUpdate({
				_id: vote._id,
				status: INpsVoteStatus.NEW,
			}, {
				$set: {
					status: INpsVoteStatus.SENDING,
					sentAt: today,
				},
			});
			return value;
		}));
		console.log('sending ->', sending);

		const votes = sending.filter(Boolean) as INpsVote[];
		console.log('votes ->', votes);

		const payload = {
			total,
			votes,
		};
		// TODO send to cloud
		console.log('payload', payload);
		sendToCloud(nps._id, payload);

		const voteIds = votes.map(({ _id }) => _id);
		console.log('voteIds ->', voteIds);
		if (!voteIds) {
			return;
		}

		this.NpsVote.updateVotesToSent(voteIds);

		const missing = await this.NpsVote.findOneNotSentByNpsId(nps._id, { projection: { _id: 0, npsId: 1 } });
		console.log('missing ->', missing);
		if (missing) {
			return;
		}

		await this.Nps.updateStatusById(nps._id, NPSStatus.SENT);
	}

	async vote({
		userId,
		npsId,
		roles,
		score,
		comment,
	}: NPSVotePayload): Promise<void> {
		const npsEnabled = await this.Settings.getValueById('NPS_survey_enabled');
		if (!npsEnabled) {
			return;
		}

		if (!npsId || typeof npsId !== 'string') {
			throw new Error('Invalid NPS id');
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

		const result = await this.NpsVote.save({
			ts: new Date(),
			npsId,
			identifier,
			roles,
			score,
			comment,
			status: INpsVoteStatus.NEW,
		});
		if (!result) {
			throw new Error('Error saving NPS vote');
		}
	}
}
