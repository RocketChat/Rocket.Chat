import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { FreeSwitchChannelRaw } from './raw/FreeSwitchChannel';

registerModel('IFreeSwitchChannelModel', new FreeSwitchChannelRaw(db));
