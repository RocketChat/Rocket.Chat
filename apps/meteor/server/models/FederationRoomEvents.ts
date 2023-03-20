import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { FederationRoomEvents } from './raw/FederationRoomEvents';

registerModel('IFederationRoomEventsModel', new FederationRoomEvents(db));
