import { RoomType } from 'temporary-rocketlets-ts-definition/rooms';

export class RocketletRoomBridge {
	constructor(orch) {
		this.orch = orch;
	}

	create(room, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is creating a new room.`, room);

		const rcRoom = this.orch.getConverters().get('rooms').convertRocketletRoom(room);
		let method;

		switch (room.type) {
			case RoomType.CHANNEL:
				method = 'createChannel';
				break;
			case RoomType.PRIVATE_GROUP:
				method = 'createPrivateGroup';
				break;
			default:
				throw new Error('Only channels and private groups can be created.');
		}

		let rid;
		Meteor.runAsUser(room.creator.id, () => {
			const info = Meteor.call(method, rcRoom.usernames);
			rid = info.rid;
		});

		return rid;
	}

	getById(roomId, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is getting the roomById: "${ roomId }"`);

		return this.orch.getConverters().get('rooms').convertById(roomId);
	}

	getByName(roomName, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is getting the roomByName: "${ roomName }"`);

		return this.orch.getConverters().get('rooms').convertByName(roomName);
	}

	update(room, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is updating a room.`);

		if (!room.id || RocketChat.models.Rooms.findOneById(room.id)) {
			throw new Error('A room must exist to update.');
		}

		const rm = this.orch.getConverters().get('rooms').convertRocketletRoom(room);

		RocketChat.models.Rooms.update(rm._id, rm);
	}
}
