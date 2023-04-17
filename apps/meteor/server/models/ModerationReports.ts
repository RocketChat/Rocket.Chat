import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { ModerationReportsRaw as ModerationReportsRaw } from './raw/ModerationReports';

registerModel('IModerationReportsModel', () => new ModerationReportsRaw(db));
