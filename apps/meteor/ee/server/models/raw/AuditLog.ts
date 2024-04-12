import type { RocketChatRecordDeleted, IAuditLog } from '@rocket.chat/core-typings';
import type { Collection } from 'mongodb';

import { BaseRaw } from '../../../../server/models/raw/BaseRaw';

export class AuditLogRaw extends BaseRaw<IAuditLog> {
	constructor(trash?: Collection<RocketChatRecordDeleted<IAuditLog>>) {
		super('audit_log', trash);
	}
}
