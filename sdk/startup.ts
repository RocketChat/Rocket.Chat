import { Authorization } from './services/authorization';
import { api } from './api';
import { LocalBroker } from './lib/LocalBroker';

api.setBroker(new LocalBroker());

api.registerService(new Authorization());
