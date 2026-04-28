import type { IExternalComponentsExtend } from '@rocket.chat/apps-engine/definition/accessors';
import type { IExternalComponent } from '@rocket.chat/apps-engine/definition/externalComponent/IExternalComponent';

import type { AppExternalComponentManager } from '../managers/AppExternalComponentManager';

export class ExternalComponentsExtend implements IExternalComponentsExtend {
	constructor(
		private readonly manager: AppExternalComponentManager,
		private readonly appId: string,
	) {}

	public async register(externalComponent: IExternalComponent): Promise<void> {
		return Promise.resolve(this.manager.addExternalComponent(this.appId, externalComponent));
	}
}
