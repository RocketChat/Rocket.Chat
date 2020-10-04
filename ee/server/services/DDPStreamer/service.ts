import '../../broker';

import { api } from '../../../../server/sdk/api';
import { DDPStreamer } from './DDPStreamer';
import { NotificationService } from '../../../../server/services/listeners/notification';
import notifications from './streams/index';

api.registerService(new DDPStreamer());
api.registerService(new NotificationService(notifications));
