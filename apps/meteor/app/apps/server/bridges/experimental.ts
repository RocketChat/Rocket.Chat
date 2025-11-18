import type { IAppServerOrchestrator } from '@rocket.chat/apps';
import { ExperimentalBridge } from '@rocket.chat/apps-engine/server/bridges';

export class AppExperimentalBridge extends ExperimentalBridge {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	constructor(private readonly orch: IAppServerOrchestrator) {
		super();
	}
}
