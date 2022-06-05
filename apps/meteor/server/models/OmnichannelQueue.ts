import { registerModel } from '@rocket.chat/models';
import type { IOmnichannelQueueModel } from '@rocket.chat/model-typings';

import { trashCollection } from '../database/trash';
import MeteorModel from '../../app/models/server/models/OmnichannelQueue';
import { OmnichannelQueueRaw } from './raw/OmnichannelQueue';

const col = MeteorModel.model.rawCollection();
registerModel('IOmnichannelQueueModel', new OmnichannelQueueRaw(col, trashCollection) as IOmnichannelQueueModel);
