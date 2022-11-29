import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { AppsPersistenceRaw } from './raw/AppsPersistence';

registerModel('IAppsPersistenceModel', new AppsPersistenceRaw(db));
