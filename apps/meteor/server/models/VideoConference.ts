import { registerModel } from '@rocket.chat/models';

import { VideoConferenceRaw } from './raw/VideoConference';

registerModel('IVideoConferenceModel', new VideoConferenceRaw());
