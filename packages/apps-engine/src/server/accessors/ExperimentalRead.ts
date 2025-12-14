import type { IExperimentalRead } from '../../definition/accessors';
import type { ExperimentalBridge } from '../bridges';

export class ExperimentalRead implements IExperimentalRead {
	constructor(
		protected readonly experimentalBridge: ExperimentalBridge,
		protected readonly appId: string,
	) {}
}
