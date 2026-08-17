import { registerModel } from '@rocket.chat/models';

import { ReadReceiptsArchiveRaw } from './raw/ReadReceiptsArchive';
import { db } from '../../../server/database/utils';

registerModel('IReadReceiptsArchiveModel', new ReadReceiptsArchiveRaw(db));
