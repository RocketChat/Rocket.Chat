import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { WorkspaceCredentialsRaw } from './raw/WorkspaceCredentials';

registerModel('IWorkspaceCredentialsModel', new WorkspaceCredentialsRaw(db));
