// TODO: check config
// import config from 'moleculer.config';

import { api } from '../../../../server/sdk/api';
import { StreamHub } from './StreamHub';

import '../../broker';

api.registerService(new StreamHub());
