import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { ModerationReportsRaw } from './raw/ModerationReports';

registerModel('IModerationReportsModel', () => new ModerationReportsRaw(db));
