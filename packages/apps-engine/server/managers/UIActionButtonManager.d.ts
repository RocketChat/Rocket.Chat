import type { IUIActionButton, IUIActionButtonDescriptor } from '../../definition/ui';
import type { AppManager } from '../AppManager';
export declare class UIActionButtonManager {
    private readonly activationBridge;
    private registeredActionButtons;
    constructor(manager: AppManager);
    registerActionButton(appId: string, button: IUIActionButtonDescriptor): boolean;
    clearAppActionButtons(appId: string): void;
    getAppActionButtons(appId: string): Map<string, IUIActionButtonDescriptor>;
    getAllActionButtons(): IUIActionButton[];
    private hasPermission;
}
