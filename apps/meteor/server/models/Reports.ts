import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { ReportsRaw } from './raw/Reports';

registerModel('IReportsModel', new ReportsRaw(db));
