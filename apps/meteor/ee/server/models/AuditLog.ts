import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../../../server/database/trash';
import { db } from '../../../server/database/utils';
import { AuditLogRaw } from './raw/AuditLog';

registerModel('IAuditLogModel', new AuditLogRaw(db, trashCollection));
