import { registerModel } from '@rocket.chat/models';

import { OAuthAuthCodesRaw } from './raw/OAuthAuthCodes';

registerModel('IOAuthAuthCodesModel', new OAuthAuthCodesRaw());
