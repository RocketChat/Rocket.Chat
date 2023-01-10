import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';
import type { IVisitor } from '@rocket.chat/apps-engine/definition/livechat';

import { ServiceClass } from '../../../server/sdk/types/ServiceClass';
import type { AppServerOrchestrator } from './orchestrator';
import { OrchestratorFactory } from './orchestratorFactory';
import type { IAppsConverterService } from '../../../server/sdk/types/IAppsConverterService';

export class AppsConverterService extends ServiceClass implements IAppsConverterService {
	protected name = 'apps';

	private apps: AppServerOrchestrator;

	constructor() {
		super();
		this.apps = OrchestratorFactory.getOrchestrator();
	}

	async convertRoomById(id: string): Promise<IRoom> {
		return this.apps.getConverters()?.get('rooms').convertById(id);
	}

	async convertMessageById(id: string): Promise<IMessage> {
		return this.apps.getConverters()?.get('messages').convertById(id);
	}

	async convertVistitorByToken(token: string): Promise<IVisitor> {
		return this.apps.getConverters()?.get('visitors').convertByToken(token);
	}

	async convertUserToApp(user: any): Promise<IUser> {
		return this.apps.getConverters()?.get('users').convertToApp(user);
	}
}
