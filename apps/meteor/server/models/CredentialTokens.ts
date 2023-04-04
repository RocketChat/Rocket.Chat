import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { CredentialTokensRaw } from './raw/CredentialTokens';

registerModel('ICredentialTokensModel', new CredentialTokensRaw(db));
