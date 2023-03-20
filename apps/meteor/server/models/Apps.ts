import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { AppsRaw } from './raw/Apps';

registerModel('IAppsModel', new AppsRaw(db));
