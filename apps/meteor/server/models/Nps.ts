import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { NpsRaw } from './raw/Nps';

registerModel('INpsModel', new NpsRaw(db));
