import type { IPersistenceRead } from '@rocket.chat/apps-engine/definition/accessors';
import type { RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';

import { bridgeCall } from '../../bridges/bridgeCall';
import type * as Messenger from '../../messenger';

export class PersistenceRead implements IPersistenceRead {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public read(id: string): Promise<object> {
		return bridgeCall<object>(this.senderFn, 'getPersistenceBridge', 'doReadById', id, 'APP_ID');
	}

	public readByAssociation(association: RocketChatAssociationRecord): Promise<Array<object>> {
		return bridgeCall<Array<object>>(this.senderFn, 'getPersistenceBridge', 'doReadByAssociations', new Array(association), 'APP_ID');
	}

	public readByAssociations(associations: Array<RocketChatAssociationRecord>): Promise<Array<object>> {
		return bridgeCall<Array<object>>(this.senderFn, 'getPersistenceBridge', 'doReadByAssociations', associations, 'APP_ID');
	}
}
