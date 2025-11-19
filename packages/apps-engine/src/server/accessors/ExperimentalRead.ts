import type { IExperimentalRead } from '../../definition/accessors';
import type { ExperimentalBridge } from '../bridges';

export class ExperimentalRead implements IExperimentalRead {
	constructor(
		private experimentalBridge: ExperimentalBridge,
		private appId: string,
	) {}

	public async getUserRoomIds(userId: string): Promise<string[] | undefined> {
		return this.experimentalBridge.doGetUserRoomIds(userId, this.appId);
	}
}
