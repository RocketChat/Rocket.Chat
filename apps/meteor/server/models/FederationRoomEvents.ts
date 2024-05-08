import { registerModel } from '@rocket.chat/models';

import { FederationRoomEvents } from './raw/FederationRoomEvents';

registerModel('IFederationRoomEventsModel', new FederationRoomEvents());
