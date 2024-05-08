import { registerModel } from '@rocket.chat/models';

import { ReportsRaw } from './raw/Reports';

registerModel('IReportsModel', new ReportsRaw());
