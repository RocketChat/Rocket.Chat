import type { IPersistenceRead } from '@rocket.chat/apps-engine/definition/accessors';
import type { RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';

import type { RemoteBridges } from '../../bridges/RemoteBridges';

export class PersistenceRead implements IPersistenceRead {
	constructor(private readonly bridges: RemoteBridges) {}

	public read(id: string): Promise<object> {
		return this.bridges.getPersistenceBridge().doReadById(id, 'APP_ID') as Promise<object>;
	}

	public readByAssociation(association: RocketChatAssociationRecord): Promise<Array<object>> {
		return this.bridges.getPersistenceBridge().doReadByAssociations(new Array(association), 'APP_ID') as Promise<Array<object>>;
	}

	public readByAssociations(associations: Array<RocketChatAssociationRecord>): Promise<Array<object>> {
		return this.bridges.getPersistenceBridge().doReadByAssociations(associations, 'APP_ID') as Promise<Array<object>>;
	}
}
