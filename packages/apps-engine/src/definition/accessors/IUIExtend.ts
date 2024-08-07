import type { IUIActionButtonDescriptor } from '../ui';

export interface IUIExtend {
    registerButton(button: IUIActionButtonDescriptor): void;
}
