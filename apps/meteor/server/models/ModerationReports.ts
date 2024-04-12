import { registerModel } from '@rocket.chat/models';

import { ModerationReportsRaw } from './raw/ModerationReports';

registerModel('IModerationReportsModel', () => new ModerationReportsRaw());
