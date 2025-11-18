import type { IExperimentalRead } from '../../definition/accessors';
import type { ExperimentalBridge } from '../bridges';

export class ExperimentalRead implements IExperimentalRead {
	constructor(
		private readonly experimentalBridge: ExperimentalBridge,
		private readonly appId: string,
	) {}
}
