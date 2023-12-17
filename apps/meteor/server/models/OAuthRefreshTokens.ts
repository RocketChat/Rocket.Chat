import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { OAuthRefreshTokensRaw } from './raw/OAuthRefreshTokens';

registerModel('IOAuthRefreshTokensModel', new OAuthRefreshTokensRaw(db));
