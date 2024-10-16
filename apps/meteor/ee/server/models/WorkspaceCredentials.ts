import { registerModel } from '@rocket.chat/models';

import { db } from '../../../server/database/utils';
import { WorkspaceCredentialsRaw } from './raw/WorkspaceCredentials';

registerModel('IWorkspaceCredentialsModel', new WorkspaceCredentialsRaw(db));
