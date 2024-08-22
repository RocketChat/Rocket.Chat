import { registerModel } from '@rocket.chat/models';

import { db } from '../../../server/database/utils';
import { CannedResponseRaw } from './raw/CannedResponse';

registerModel('ICannedResponseModel', new CannedResponseRaw(db));
