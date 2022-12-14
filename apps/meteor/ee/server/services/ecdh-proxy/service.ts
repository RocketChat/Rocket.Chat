import '../../startup/broker';

import { api } from '@rocket.chat/core-sdk';

import { ECDHProxy } from './ECDHProxy';

api.registerService(new ECDHProxy());
