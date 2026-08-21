import type { IPersistence } from '@rocket.chat/apps-engine/definition/accessors';
import type { RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';

import { bridgeCall } from '../bridges/bridgeCall';
import type * as Messenger from '../messenger';

export class Persistence implements IPersistence {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public create(data: object): Promise<string> {
		return bridgeCall<string>(this.senderFn, 'getPersistenceBridge', 'doCreate', data, 'APP_ID');
	}

	public createWithAssociation(data: object, association: RocketChatAssociationRecord): Promise<string> {
		return bridgeCall<string>(this.senderFn, 'getPersistenceBridge', 'doCreateWithAssociations', data, new Array(association), 'APP_ID');
	}

	public createWithAssociations(data: object, associations: Array<RocketChatAssociationRecord>): Promise<string> {
		return bridgeCall<string>(this.senderFn, 'getPersistenceBridge', 'doCreateWithAssociations', data, associations, 'APP_ID');
	}

	public update(id: string, data: object, upsert = false): Promise<string> {
		return bridgeCall<string>(this.senderFn, 'getPersistenceBridge', 'doUpdate', id, data, upsert, 'APP_ID');
	}

	public updateByAssociation(association: RocketChatAssociationRecord, data: object, upsert = false): Promise<string> {
		return bridgeCall<string>(
			this.senderFn,
			'getPersistenceBridge',
			'doUpdateByAssociations',
			new Array(association),
			data,
			upsert,
			'APP_ID',
		);
	}

	public updateByAssociations(associations: Array<RocketChatAssociationRecord>, data: object, upsert = false): Promise<string> {
		return bridgeCall<string>(this.senderFn, 'getPersistenceBridge', 'doUpdateByAssociations', associations, data, upsert, 'APP_ID');
	}

	public remove(id: string): Promise<object> {
		return bridgeCall<object>(this.senderFn, 'getPersistenceBridge', 'doRemove', id, 'APP_ID');
	}

	public removeByAssociation(association: RocketChatAssociationRecord): Promise<Array<object>> {
		return bridgeCall<Array<object>>(this.senderFn, 'getPersistenceBridge', 'doRemoveByAssociations', new Array(association), 'APP_ID');
	}

	public removeByAssociations(associations: Array<RocketChatAssociationRecord>): Promise<Array<object>> {
		return bridgeCall<Array<object>>(this.senderFn, 'getPersistenceBridge', 'doRemoveByAssociations', associations, 'APP_ID');
	}
}
