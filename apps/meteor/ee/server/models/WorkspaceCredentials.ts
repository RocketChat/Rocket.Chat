import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../../../server/database/trash';
import { db } from '../../../server/database/utils';
import { WorkspaceCredentialsRaw } from './raw/WorkspaceCredentials';

registerModel('IWorkspaceCredentialsModel', new WorkspaceCredentialsRaw(db, trashCollection));
