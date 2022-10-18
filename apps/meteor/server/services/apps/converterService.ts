import { ServiceClass } from '../../sdk/types/ServiceClass';
import type { AppServerOrchestrator } from './orchestrator';
import { OrchestratorFactory } from './orchestratorFactory';
import type { IAppsConverterService } from '../../sdk/types/IAppsConverterService';

export class AppsConverterService extends ServiceClass implements IAppsConverterService {
	protected name = 'apps';

	private apps: AppServerOrchestrator;

	constructor() {
		super();
		this.apps = OrchestratorFactory.getOrchestrator();
	}

	convertRoomById(id: string) {
		return this.apps.getConverters()?.get('rooms').convertById(id);
	}

	convertMessageById(id: string) {
		return this.apps.getConverters()?.get('messages').convertById(id);
	}

	convertVistitorByToken(token: string) {
		return this.apps.getConverters()?.get('visitors').convertByToken(token);
	}

	convertUserToApp(user: any) {
		return this.apps.getConverters()?.get('users').convertToApp(user);
	}
}
