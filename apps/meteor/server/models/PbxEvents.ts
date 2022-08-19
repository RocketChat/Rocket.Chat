import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { PbxEventsRaw } from './raw/PbxEvents';

registerModel('IPbxEventsModel', new PbxEventsRaw(db));
