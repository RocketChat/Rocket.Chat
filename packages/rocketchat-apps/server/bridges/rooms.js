import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

export class AppRoomBridge {
	constructor(orch) {
		this.orch = orch;
	}

	async create(room, members, appId) {
		console.log(`The App ${ appId } is creating a new room.`, room);

		const rcRoom = this.orch.getConverters().get('rooms').convertAppRoom(room);
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
			const extraData = Object.assign({}, rcRoom);
			delete extraData.name;
			delete extraData.t;
			delete extraData.ro;
			delete extraData.customFields;
			const info = Meteor.call(method, rcRoom.name, members, rcRoom.ro, rcRoom.customFields, extraData);
			rid = info.rid;
		});

		return rid;
	}

	async getById(roomId, appId) {
		console.log(`The App ${ appId } is getting the roomById: "${ roomId }"`);

		return this.orch.getConverters().get('rooms').convertById(roomId);
	}

	async getByName(roomName, appId) {
		console.log(`The App ${ appId } is getting the roomByName: "${ roomName }"`);

		return this.orch.getConverters().get('rooms').convertByName(roomName);
	}

	async getCreatorById(roomId, appId) {
		console.log(`The App ${ appId } is getting the room's creator by id: "${ roomId }"`);

		const room = RocketChat.models.Rooms.findOneById(roomId);

		if (!room || !room.u || !room.u._id) {
			return undefined;
		}

		return this.orch.getConverters().get('users').convertById(room.u._id);
	}

	async getCreatorByName(roomName, appId) {
		console.log(`The App ${ appId } is getting the room's creator by name: "${ roomName }"`);

		const room = RocketChat.models.Rooms.findOneByName(roomName);

		if (!room || !room.u || !room.u._id) {
			return undefined;
		}

		return this.orch.getConverters().get('users').convertById(room.u._id);
	}

	async update(room, members = [], appId) {
		console.log(`The App ${ appId } is updating a room.`);

		if (!room.id || !RocketChat.models.Rooms.findOneById(room.id)) {
			throw new Error('A room must exist to update.');
		}

		const rm = this.orch.getConverters().get('rooms').convertAppRoom(room);

		RocketChat.models.Rooms.update(rm._id, rm);

		for (const username of members) {
			const member = RocketChat.models.Users.findOneByUsername(username);

			if (!member) {
				continue;
			}

			RocketChat.addUserToRoom(rm._id, member);
		}
	}
}
