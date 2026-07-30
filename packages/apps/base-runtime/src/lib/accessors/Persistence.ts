import type { IPersistence } from '@rocket.chat/apps-engine/definition/accessors';
import type { RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';

import type { RemoteBridges } from '../bridges/RemoteBridges';

export class Persistence implements IPersistence {
	constructor(private readonly bridges: RemoteBridges) {}

	public create(data: object): Promise<string> {
		return this.bridges.getPersistenceBridge().doCreate(data, 'APP_ID') as Promise<string>;
	}

	public createWithAssociation(data: object, association: RocketChatAssociationRecord): Promise<string> {
		return this.bridges.getPersistenceBridge().doCreateWithAssociations(data, new Array(association), 'APP_ID') as Promise<string>;
	}

	public createWithAssociations(data: object, associations: Array<RocketChatAssociationRecord>): Promise<string> {
		return this.bridges.getPersistenceBridge().doCreateWithAssociations(data, associations, 'APP_ID') as Promise<string>;
	}

	public update(id: string, data: object, upsert = false): Promise<string> {
		return this.bridges.getPersistenceBridge().doUpdate(id, data, upsert, 'APP_ID') as Promise<string>;
	}

	public updateByAssociation(association: RocketChatAssociationRecord, data: object, upsert = false): Promise<string> {
		return this.bridges.getPersistenceBridge().doUpdateByAssociations(new Array(association), data, upsert, 'APP_ID') as Promise<string>;
	}

	public updateByAssociations(associations: Array<RocketChatAssociationRecord>, data: object, upsert = false): Promise<string> {
		return this.bridges.getPersistenceBridge().doUpdateByAssociations(associations, data, upsert, 'APP_ID') as Promise<string>;
	}

	public remove(id: string): Promise<object> {
		return this.bridges.getPersistenceBridge().doRemove(id, 'APP_ID') as Promise<object>;
	}

	public removeByAssociation(association: RocketChatAssociationRecord): Promise<Array<object>> {
		return this.bridges.getPersistenceBridge().doRemoveByAssociations(new Array(association), 'APP_ID') as Promise<Array<object>>;
	}

	public removeByAssociations(associations: Array<RocketChatAssociationRecord>): Promise<Array<object>> {
		return this.bridges.getPersistenceBridge().doRemoveByAssociations(associations, 'APP_ID') as Promise<Array<object>>;
	}
}
