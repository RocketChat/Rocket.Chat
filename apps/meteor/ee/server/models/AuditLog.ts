import { registerModel } from '@rocket.chat/models';

import { AuditLogRaw } from './raw/AuditLog';
import { trashCollection } from '../../../server/database/trash';
import { db } from '../../../server/database/utils';

registerModel('IAuditLogModel', new AuditLogRaw(db, trashCollection));
