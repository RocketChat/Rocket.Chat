import { api } from '../../../../server/sdk/api';
import { DDPStreamer } from './DDPStreamer';

import '../../broker';

api.registerService(new DDPStreamer());
