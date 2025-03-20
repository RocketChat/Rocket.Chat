import '@rocket.chat/network-broker';
import { api } from '@rocket.chat/core-services';

import { ECDHProxy } from './ECDHProxy';

api.registerService(new ECDHProxy());
