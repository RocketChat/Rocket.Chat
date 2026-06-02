import type { IModerationAuditLog } from '@rocket.chat/core-typings';
import type { IModerationAuditLogsModel } from '@rocket.chat/model-typings';
import type { Db, Collection, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class ModerationAuditLogsRaw extends BaseRaw<IModerationAuditLog> implements IModerationAuditLogsModel {
	constructor(db: Db, trash?: Collection<any>) {
		super(db, 'moderation_audit_logs', trash);
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { ts: -1 } }, { key: { 'moderator._id': 1 } }, { key: { 'targetUser._id': 1 } }, { key: { action: 1 } }];
	}
}
