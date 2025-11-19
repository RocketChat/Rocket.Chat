import { registerModel, AuditLogRaw } from '@rocket.chat/models';

import { trashCollection } from '../../../server/database/trash';
import { db } from '../../../server/database/utils';

registerModel('IAuditLogModel', new AuditLogRaw(db, trashCollection));
