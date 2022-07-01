import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { VideoConferenceRaw } from './raw/VideoConference';

registerModel('IVideoConferenceModel', new VideoConferenceRaw(db, trashCollection));
