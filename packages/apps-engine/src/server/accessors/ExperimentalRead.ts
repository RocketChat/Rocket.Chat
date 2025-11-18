import type { IExperimentalRead } from '../../definition/accessors';
import type { ExperimentalBridge } from '../bridges';

export class ExperimentalRead implements IExperimentalRead {
	constructor(
		private readonly experimentalBridge: ExperimentalBridge,
		private readonly appId: string,
	) {
		this.keepContext();
	}

	private keepContext(): void {
		void this.experimentalBridge;
		void this.appId;
	}
}
