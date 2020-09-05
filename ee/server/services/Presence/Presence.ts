// TODO: check config
// import config from 'moleculer.config';

import { api } from '../../../../server/sdk/api';
import { Presence } from './service';

import '../../broker';

api.registerService(new Presence());
