import { registerModel } from '@rocket.chat/models';

import { db } from '../../../server/database/utils';
import { trashCollection } from '../../../server/database/trash';
import { AuditLogRaw } from './raw/AuditLog';

registerModel('IAuditLogModel', new AuditLogRaw(db, trashCollection));
