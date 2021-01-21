import { BaseRaw } from './BaseRaw';
import { INps, NPSStatus } from '../../../../definition/INps';

export class NpsRaw extends BaseRaw<INps> {
	// get expired surveys still in progress
	async getOpenExpiredAndStartSending(): Promise<INps | undefined> {
		const today = new Date();

		const query = {
			expireAt: { $lte: today },
			status: NPSStatus.OPEN,
		};
		const update = {
			$set: {
				status: NPSStatus.SENDING,
			},
		};
		const { value } = await this.col.findOneAndUpdate(query, update, { sort: { expireAt: 1 } });

		return value;
	}
}
