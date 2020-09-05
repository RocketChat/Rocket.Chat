import { api } from '../../../../server/sdk/api';
import { Account } from './service';

import '../../broker';

api.registerService(new Account());
