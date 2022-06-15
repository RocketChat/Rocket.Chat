import '../../startup/broker';

import { api } from '../../../../server/sdk/api';
import { StreamHub } from './StreamHub';

api.registerService(new StreamHub());
