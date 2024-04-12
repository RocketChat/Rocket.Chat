import { registerModel } from '@rocket.chat/models';

import { AppsPersistenceModel } from './raw/AppsPersistence';

registerModel('IAppsPersistenceModel', new AppsPersistenceModel());
