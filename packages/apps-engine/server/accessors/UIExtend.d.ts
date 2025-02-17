import type { IUIExtend } from '../../definition/accessors';
import type { IUIActionButtonDescriptor } from '../../definition/ui';
import type { UIActionButtonManager } from '../managers/UIActionButtonManager';
export declare class UIExtend implements IUIExtend {
    private readonly manager;
    private readonly appId;
    constructor(manager: UIActionButtonManager, appId: string);
    registerButton(button: IUIActionButtonDescriptor): void;
}
