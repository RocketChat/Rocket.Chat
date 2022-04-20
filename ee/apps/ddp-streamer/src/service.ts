import '../../../../apps/meteor/ee/server/startup/broker';

import { api } from '../../../../apps/meteor/server/sdk/api';
import { DDPStreamer } from './DDPStreamer';

api.registerService(new DDPStreamer());
