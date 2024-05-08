import { registerModel } from '@rocket.chat/models';

import { CannedResponseRaw } from './raw/CannedResponse';

registerModel('ICannedResponseModel', new CannedResponseRaw());
