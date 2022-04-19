import '../../startup/broker';

import { api } from '../../../../server/sdk/api';
import { Presence } from './Presence';

api.registerService(new Presence());
