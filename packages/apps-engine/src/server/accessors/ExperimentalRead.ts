import type { IExperimentalRead } from '../../definition/accessors';
import type { ExperimentalBridge } from '../bridges';

export class ExperimentalRead implements IExperimentalRead {
	constructor(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		private readonly experimentalBridge: ExperimentalBridge,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		private readonly appId: string,
	) {}
}
