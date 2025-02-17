import type { ISettingRead } from '../../definition/accessors';
import type { ISetting } from '../../definition/settings';
import type { ProxiedApp } from '../ProxiedApp';
export declare class SettingRead implements ISettingRead {
    private readonly app;
    constructor(app: ProxiedApp);
    getById(id: string): Promise<ISetting>;
    getValueById(id: string): Promise<any>;
}
