import type { AppExternalComponentManager } from '../managers/AppExternalComponentManager';
import type { IExternalComponentsExtend } from '../../definition/accessors';
import type { IExternalComponent } from '../../definition/externalComponent/IExternalComponent';

export class ExternalComponentsExtend implements IExternalComponentsExtend {
    constructor(private readonly manager: AppExternalComponentManager, private readonly appId: string) {}

    public async register(externalComponent: IExternalComponent): Promise<void> {
        return Promise.resolve(this.manager.addExternalComponent(this.appId, externalComponent));
    }
}
