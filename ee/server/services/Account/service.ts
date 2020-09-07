import { api } from '../../../../server/sdk/api';
import { Account } from './Account';

import '../../broker';

api.registerService(new Account());
