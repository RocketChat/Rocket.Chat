import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { OAuthAccessTokensRaw } from './raw/OAuthAccessTokens';

registerModel('IOAuthAccessTokensModel', new OAuthAccessTokensRaw(db));
