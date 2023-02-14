import { RoomManager } from '../../app/ui-utils/client';
import { RoomManager as NewRoomManager } from '../lib/RoomManager';

// cleanup session when hot reloading
Session.set('openedRoom', null);

NewRoomManager.on('changed', (rid) => {
	Session.set('openedRoom', rid);
	RoomManager.openedRoom = rid;
});
