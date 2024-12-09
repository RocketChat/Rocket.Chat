import type { IInstanceStatus } from '@rocket.chat/core-typings';
import type { IInstanceStatusModel } from '@rocket.chat/model-typings';
import type { Db, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class InstanceStatusRaw extends BaseRaw<IInstanceStatus> implements IInstanceStatusModel {
	constructor(db: Db) {
		super(db, 'instances', undefined, {
			preventSetUpdatedAt: true,
			collectionNameResolver(name) {
				return name;
			},
		});
	}

	async getActiveInstanceCount(): Promise<number> {
		return this.col.countDocuments({ _updatedAt: { $gt: new Date(Date.now() - process.uptime() * 1000 - 2000) } });
	}

	async getActiveInstancesAddress(): Promise<string[]> {
		const instances = await this.find({}, { projection: { _id: 1, extraInformation: { host: 1, tcpPort: 1 } } }).toArray();
		return instances.map((instance) => `${instance.extraInformation.host}:${instance.extraInformation.tcpPort}/${instance._id}`);
	}

	async setDocumentHeartbeat(documentId: string): Promise<UpdateResult> {
		return this.updateOne({ _id: documentId }, { $currentDate: { _updatedAt: true } });
	}
}
