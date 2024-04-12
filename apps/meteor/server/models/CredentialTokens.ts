import { registerModel } from '@rocket.chat/models';

import { CredentialTokensRaw } from './raw/CredentialTokens';

registerModel('ICredentialTokensModel', new CredentialTokensRaw());
