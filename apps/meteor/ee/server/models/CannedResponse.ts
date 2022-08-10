import { registerModel } from '@rocket.chat/models';

import { db } from '../../../server/database/utils';
import { CannedResponse } from './raw/CannedResponse';

registerModel('ICannedResponseModel', new CannedResponse(db));
