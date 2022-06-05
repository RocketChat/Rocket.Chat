import { registerModel } from '@rocket.chat/models';
import type { ICredentialTokensModel } from '@rocket.chat/model-typings';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { CredentialTokensRaw } from './raw/CredentialTokens';

const col = db.collection(`${prefix}credential_tokens`);
registerModel('ICredentialTokensModel', new CredentialTokensRaw(col, trashCollection) as ICredentialTokensModel);
