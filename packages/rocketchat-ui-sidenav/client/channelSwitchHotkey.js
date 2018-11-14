import { Session } from 'meteor/session';
import { rooms as getRooms, roomType } from './roomsHelpers';

function changeChannelToNext(up) {
	const openedId = Session.get('openedRoom');
	const roomTypes = roomType();
	const rooms = [];
	roomTypes.forEach(function(type) {
		rooms.push(...getRooms.apply(type.data).fetch());
	});
	let roomId = rooms.findIndex(function(room) {
		return room.rid === openedId;
	});

	if (roomId === -1) {
		return;
	}

	roomId += up ? -1 : 1;

	if (typeof(rooms[roomId]) === 'undefined') {
		roomId = up ? (rooms.length - 1) : 0;
	}

	const nextRoom = rooms[roomId];
	RocketChat.roomTypes.openRouteLink(nextRoom.t, nextRoom);
}

// Ctrl-(Shift)-Tab channel changing - useful in RocketChat Electron app
document.addEventListener('keyup', (e) => {
	const ctrlTab = e.ctrlKey && e.which === 9;
	if (!ctrlTab) {
		return;
	}

	changeChannelToNext(e.shiftKey);
});

// Alt-arrow up/down channel changing - useful in RocketChat in web browser
document.addEventListener('keydown', (e) => {
	const goUp = e.altKey && e.which === 38;
	const goDown = e.altKey && e.which === 40;
	if (!goUp && !goDown) {
		return;
	}

	e.stopPropagation();

	changeChannelToNext(goUp);
}, true);
