import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { ReadsRaw } from './raw/Reads';

registerModel('IReadsModel', new ReadsRaw(db));
