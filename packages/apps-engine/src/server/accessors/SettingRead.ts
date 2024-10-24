import type { ISettingRead } from '../../definition/accessors';
import type { ISetting } from '../../definition/settings';
import type { ProxiedApp } from '../ProxiedApp';

export class SettingRead implements ISettingRead {
    constructor(private readonly app: ProxiedApp) {}

    public getById(id: string): Promise<ISetting> {
        return Promise.resolve(this.app.getStorageItem().settings[id]);
    }

    public async getValueById(id: string): Promise<any> {
        const set = await this.getById(id);

        if (typeof set === 'undefined') {
            throw new Error(`Setting "${id}" does not exist.`);
        }

        if (set.value === undefined || set.value === null) {
            return set.packageValue;
        }

        return set.value;
    }
}
