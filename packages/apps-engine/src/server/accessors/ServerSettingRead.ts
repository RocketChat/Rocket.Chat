import type { IServerSettingRead } from '../../definition/accessors';
import type { ISetting } from '../../definition/settings';
import type { ServerSettingBridge } from '../bridges/ServerSettingBridge';

export class ServerSettingRead implements IServerSettingRead {
    constructor(
        private readonly settingBridge: ServerSettingBridge,
        private readonly appId: string,
    ) {}

    public getOneById(id: string): Promise<ISetting> {
        return this.settingBridge.doGetOneById(id, this.appId);
    }

    public async getValueById(id: string): Promise<any> {
        const set = await this.settingBridge.doGetOneById(id, this.appId);

        if (typeof set === 'undefined') {
            throw new Error(`No Server Setting found, or it is unaccessible, by the id of "${id}".`);
        }

        if (set.value === undefined || set.value === null) {
            return set.packageValue;
        }

        return set.value;
    }

    public getAll(): Promise<IterableIterator<ISetting>> {
        throw new Error('Method not implemented.');
        // return this.settingBridge.getAll(this.appId);
    }

    public isReadableById(id: string): Promise<boolean> {
        return this.settingBridge.doIsReadableById(id, this.appId);
    }
}
