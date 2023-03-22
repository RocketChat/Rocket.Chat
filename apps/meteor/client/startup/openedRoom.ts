import { LegacyRoomManager } from '../../app/ui-utils/client';
import { RoomManager } from '../lib/RoomManager';

// cleanup session when hot reloading
Session.set('openedRoom', null);

RoomManager.on('changed', (rid) => {
	Session.set('openedRoom', rid);
	LegacyRoomManager.openedRoom = rid;
});
