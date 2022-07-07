import { createHash } from 'crypto';

import { NPSStatus, INpsVoteStatus, INpsVote, INps } from '@rocket.chat/core-typings';
import { Nps, NpsVote, Settings } from '@rocket.chat/models';

import { INPSService, NPSVotePayload, NPSCreatePayload } from '../../sdk/types/INPSService';
import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { Banner, NPS } from '../../sdk';
import { sendNpsResults } from './sendNpsResults';
import { getBannerForAdmins, notifyAdmins } from './notification';
import { SystemLogger } from '../../lib/logger/system';

export class NPSService extends ServiceClassInternal implements INPSService {
	protected name = 'nps';

	async create(nps: NPSCreatePayload): Promise<boolean> {
		const npsEnabled = await Settings.getValueById('NPS_survey_enabled');
		if (!npsEnabled) {
			throw new Error('Server opted-out for NPS surveys');
		}

		const any = await Nps.findOne({}, { projection: { _id: 1 } });
		if (!any) {
			Banner.create(getBannerForAdmins(nps.startAt));

			notifyAdmins(nps.startAt);
		}

		const { npsId, startAt, expireAt, createdBy } = nps;

		try {
			await Nps.save({
				_id: npsId,
				startAt,
				expireAt,
				createdBy,
				status: NPSStatus.OPEN,
			});
		} catch (err) {
			SystemLogger.error({ msg: 'Error creating NPS', err });
			throw new Error('Error creating NPS');
		}

		return true;
	}

	async sendResults(): Promise<void> {
		const npsEnabled = await Settings.getValueById('NPS_survey_enabled');
		if (!npsEnabled) {
			return;
		}

		const npsSending = await Nps.getOpenExpiredAlreadySending();

		const nps = npsSending || (await Nps.getOpenExpiredAndStartSending());
		if (!nps) {
			return;
		}

		const total = await NpsVote.findByNpsId(nps._id).count();

		const votesToSend = await NpsVote.findNotSentByNpsId(nps._id).toArray();

		// if there is nothing to sent, check if something gone wrong
		if (votesToSend.length === 0) {
			// check if still has votes left to send
			const totalSent = await NpsVote.findByNpsIdAndStatus(nps._id, INpsVoteStatus.SENT).count();
			if (totalSent === total) {
				await Nps.updateStatusById(nps._id, NPSStatus.SENT);
				return;
			}

			// update old votes (sent 5 minutes ago or more) in 'sending' status back to 'new'
			await NpsVote.updateOldSendingToNewByNpsId(nps._id);

			// try again in 5 minutes
			setTimeout(() => NPS.sendResults(), 5 * 60 * 1000);
			return;
		}

		const today = new Date();

		const sending = await Promise.all(
			votesToSend.map(async (vote) => {
				const { value } = await NpsVote.col.findOneAndUpdate(
					{
						_id: vote._id,
						status: INpsVoteStatus.NEW,
					},
					{
						$set: {
							status: INpsVoteStatus.SENDING,
							sentAt: today,
						},
					},
					{
						projection: {
							identifier: 1,
							roles: 1,
							score: 1,
							comment: 1,
						},
					},
				);
				return value;
			}),
		);

		const votes = sending.filter(Boolean) as Pick<INpsVote, '_id' | 'identifier' | 'roles' | 'score' | 'comment'>[];
		if (votes.length > 0) {
			const voteIds = votes.map(({ _id }) => _id);

			const votesWithoutIds = votes.map(({ identifier, roles, score, comment }) => ({
				identifier,
				roles,
				score,
				comment,
			}));

			const payload = {
				total,
				votes: votesWithoutIds,
			};
			sendNpsResults(nps._id, payload);

			await NpsVote.updateVotesToSent(voteIds);
		}

		const totalSent = await NpsVote.findByNpsIdAndStatus(nps._id, INpsVoteStatus.SENT).count();
		if (totalSent < total) {
			// send more in five minutes
			setTimeout(() => NPS.sendResults(), 5 * 60 * 1000);
			return;
		}

		await Nps.updateStatusById(nps._id, NPSStatus.SENT);
	}

	async vote({ userId, npsId, roles, score, comment }: NPSVotePayload): Promise<void> {
		const npsEnabled = await Settings.getValueById('NPS_survey_enabled');
		if (!npsEnabled) {
			return;
		}

		if (!npsId || typeof npsId !== 'string') {
			throw new Error('Invalid NPS id');
		}

		const nps = await Nps.findOneById<Pick<INps, 'status' | 'startAt' | 'expireAt'>>(npsId, {
			projection: { status: 1, startAt: 1, expireAt: 1 },
		});
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

		const identifier = createHash('sha256').update(`${userId}${npsId}`).digest('hex');

		const result = await NpsVote.save({
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

	async closeOpenSurveys(): Promise<void> {
		await Nps.closeAllByStatus(NPSStatus.OPEN);
	}
}
