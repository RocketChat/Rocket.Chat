import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../../../server/database/trash';
import { AuditLogRaw } from './raw/AuditLog';

registerModel('IAuditLogModel', new AuditLogRaw(trashCollection));
