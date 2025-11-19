import type { RocketChatRecordDeleted, IAuditLog } from '@rocket.chat/core-typings';
import type { Collection, Db } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class AuditLogRaw extends BaseRaw<IAuditLog> {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IAuditLog>>) {
		super(db, 'audit_log', trash);
	}
}
