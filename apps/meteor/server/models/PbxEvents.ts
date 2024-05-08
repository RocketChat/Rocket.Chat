import { registerModel } from '@rocket.chat/models';

import { PbxEventsRaw } from './raw/PbxEvents';

registerModel('IPbxEventsModel', new PbxEventsRaw());
