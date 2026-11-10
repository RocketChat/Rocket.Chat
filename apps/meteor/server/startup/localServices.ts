import { api } from '@rocket.chat/core-services';

import { localBroker } from './localBroker';

api.setBroker(localBroker);
void api.start();
