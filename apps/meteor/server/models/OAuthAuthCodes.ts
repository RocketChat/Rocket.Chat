import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { OAuthAuthCodesRaw } from './raw/OAuthAuthCodes';

registerModel('IOAuthAuthCodesModel', new OAuthAuthCodesRaw(db));
