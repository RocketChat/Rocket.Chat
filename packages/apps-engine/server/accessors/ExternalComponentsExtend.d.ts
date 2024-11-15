import type { IExternalComponentsExtend } from '../../definition/accessors';
import type { IExternalComponent } from '../../definition/externalComponent/IExternalComponent';
import type { AppExternalComponentManager } from '../managers/AppExternalComponentManager';
export declare class ExternalComponentsExtend implements IExternalComponentsExtend {
    private readonly manager;
    private readonly appId;
    constructor(manager: AppExternalComponentManager, appId: string);
    register(externalComponent: IExternalComponent): Promise<void>;
}
