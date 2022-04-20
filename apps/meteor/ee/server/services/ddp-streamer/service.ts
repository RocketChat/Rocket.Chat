import '../../startup/broker';

import { api } from '../../../../server/sdk/api';
import { DDPStreamer } from './DDPStreamer';

api.registerService(new DDPStreamer());
