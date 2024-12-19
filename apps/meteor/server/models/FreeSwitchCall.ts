import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { FreeSwitchCallRaw } from './raw/FreeSwitchCall';

registerModel('IFreeSwitchCallModel', new FreeSwitchCallRaw(db));
