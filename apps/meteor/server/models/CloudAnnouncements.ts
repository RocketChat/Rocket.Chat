import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { CloudAnnouncementsRaw } from './raw/CloudAnnouncements';

registerModel('ICloudAnnouncementsModel', new CloudAnnouncementsRaw(db));
