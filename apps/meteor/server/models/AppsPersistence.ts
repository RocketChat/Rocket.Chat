import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { AppsPersistenceModel } from './raw/AppsPersistence';

registerModel('IAppsPersistenceModel', new AppsPersistenceModel(db));
