import '../../startup/broker';

import { api } from '../../../../server/sdk/api';
import { ECDHProxy } from './ECDHProxy';

api.registerService(new ECDHProxy());
