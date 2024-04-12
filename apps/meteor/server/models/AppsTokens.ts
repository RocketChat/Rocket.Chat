import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { AppsTokens } from './raw/AppsTokens';

registerModel('IAppsTokensModel', new AppsTokens(db));
