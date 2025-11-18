import type { IAppServerOrchestrator } from '@rocket.chat/apps';
import { ExperimentalBridge } from '@rocket.chat/apps-engine/server/bridges';

export class AppExperimentalBridge extends ExperimentalBridge {
	constructor(private readonly orch: IAppServerOrchestrator) {
		super();

		this.keepContext();
	}

	private keepContext(): void {
		void this.orch;
	}
}
