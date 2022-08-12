import '../../startup/broker';

import { api } from '../../../../server/sdk/api';
import { Account } from './Account';

api.registerService(new Account());
