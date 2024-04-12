import { registerModel } from '@rocket.chat/models';

import { OAuthAccessTokensRaw } from './raw/OAuthAccessTokens';

registerModel('IOAuthAccessTokensModel', new OAuthAccessTokensRaw());
