import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { FreeSwitchEventRaw } from './raw/FreeSwitchEvent';

registerModel('IFreeSwitchEventModel', new FreeSwitchEventRaw(db));
