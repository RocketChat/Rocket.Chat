import type { IServerSettingRead } from '@rocket.chat/apps-engine/definition/accessors';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';

import type { RemoteBridges } from '../../bridges/RemoteBridges';

export class ServerSettingRead implements IServerSettingRead {
	constructor(private readonly bridges: RemoteBridges) {}

	public getOneById(id: string): Promise<ISetting> {
		return this.bridges.getServerSettingBridge().doGetOneById(id, 'APP_ID') as Promise<ISetting>;
	}

	public async getValueById(id: string): Promise<any> {
		const set = (await this.bridges.getServerSettingBridge().doGetOneById(id, 'APP_ID')) as ISetting;

		// The host accessor checks `typeof set === 'undefined'`, but across the RPC boundary an
		// absent (undefined) host return is serialized as null, so both must be treated as "not found".
		if (set === undefined || set === null) {
			throw new Error(`No Server Setting found, or it is unaccessible, by the id of "${id}".`);
		}

		if (set.value === undefined || set.value === null) {
			return set.packageValue;
		}

		return set.value;
	}

	public getAll(): Promise<IterableIterator<ISetting>> {
		throw new Error('Method not implemented.');
	}

	public isReadableById(id: string): Promise<boolean> {
		return this.bridges.getServerSettingBridge().doIsReadableById(id, 'APP_ID') as Promise<boolean>;
	}
}
