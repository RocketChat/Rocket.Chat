import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { AppsModel } from './raw/Apps';

registerModel('IAppsModel', new AppsModel(db));
