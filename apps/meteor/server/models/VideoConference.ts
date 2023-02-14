import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { VideoConferenceRaw } from './raw/VideoConference';

registerModel('IVideoConferenceModel', new VideoConferenceRaw(db));
