import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { CredentialTokensRaw } from './raw/CredentialTokens';

registerModel('ICredentialTokensModel', new CredentialTokensRaw(db, trashCollection));
