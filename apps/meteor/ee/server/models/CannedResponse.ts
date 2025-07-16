import { registerModel } from '@rocket.chat/models';

import { CannedResponseRaw } from './raw/CannedResponse';
import { db } from '../../../server/database/utils';

registerModel('ICannedResponseModel', new CannedResponseRaw(db));
