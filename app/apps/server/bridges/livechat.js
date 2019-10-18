import { Random } from 'meteor/random';

import { getRoom } from '../../../livechat/server/api/lib/livechat';
import { Livechat } from '../../../livechat/server/lib/Livechat';
import Rooms from '../../../models/server/models/Rooms';
import LivechatVisitors from '../../../models/server/models/LivechatVisitors';
import Users from '../../../models/server/models/Users';

export class AppLivechatBridge {
	constructor(orch) {
		this.orch = orch;
	}

	async createMessage(message, appId) {
		this.orch.debugLog(`The App ${ appId } is creating a new message.`);

		if (!message.token) {
			throw new Error('Invalid token for livechat message');
		}

		const data = {
			guest: this.orch.getConverters().get('visitors').convertAppVisitor(message.visitor),
			message: this.orch.getConverters().get('messages').convertAppMessage(message),
		};

		const msg = Livechat.sendMessage(data);

		return msg._id;
	}

	async getMessageById(messageId, appId) {
		this.orch.debugLog(`The App ${ appId } is getting the message: "${ messageId }"`);

		return this.orch.getConverters().get('messages').convertById(messageId);
	}

	async updateMessage(message, appId) {
		this.orch.debugLog(`The App ${ appId } is updating a message.`);

		const data = {
			guest: message.visitor,
			message: this.orch.getConverters().get('messages').convertAppMessage(message),
		};

		Livechat.updateMessage(data);
	}

	async createRoom(visitor, agent, appId) {
		this.orch.debugLog(`The App ${ appId } is creating a livechat room.`);

		const agentUser = Users.findOneById(agent.id);
		agentUser.agentId = agentUser._id;

		return this.orch.getConverters().get('rooms').convertRoom(getRoom({
			guest: this.orch.getConverters().get('visitors').convertAppVisitor(visitor),
			agent: agentUser,
			rid: Random.id(),
		}).room);
	}

	async closeRoom(room, comment, appId) {
		this.orch.debugLog(`The App ${ appId } is closing a livechat room.`);

		return Livechat.closeRoom({
			visitor: this.orch.getConverters().get('visitors').convertAppVisitor(room.visitor),
			room: this.orch.getConverters().get('rooms').convertAppRoom(room),
			comment,
		});
	}

	async findRooms(visitor, departmentId, appId) {
		this.orch.debugLog(`The App ${ appId } is looking for livechat visitors.`);

		if (!visitor) {
			return [];
		}

		let result;

		if (departmentId) {
			result = Rooms.findOpenByVisitorTokenAndDepartmentId(visitor.token, departmentId).fetch();
		} else {
			result = Rooms.findOpenByVisitorToken(visitor.token).fetch();
		}

		return result.map((room) => this.orch.getConverters().get('rooms').convertRoom(room));
	}

	async createVisitor(visitor, appId) {
		this.orch.debugLog(`The App ${ appId } is creating a livechat visitor.`);

		const registerData = {
			department: visitor.department,
			username: visitor.username,
			name: visitor.name,
			token: visitor.token,
		};

		if (visitor.visitorEmails && visitor.visitorEmails.length) {
			registerData.email = visitor.visitorEmails[0].address;
		}

		if (visitor.phone && visitor.phone.length) {
			registerData.phone = { number: visitor.phone[0].phoneNumber };
		}

		return Livechat.registerGuest(registerData);
	}

	async transferVisitor(visitor, transferData, appId) {
		this.orch.debugLog(`The App ${ appId } is transfering a livechat.`);

		if (!visitor) {
			throw new Error('Invalid visitor, cannot transfer');
		}

		const {
			targetAgent,
			targetDepartment: departmentId,
			currentRoom,
		} = transferData;

		return Livechat.transfer(
			this.orch.getConverters().get('rooms').convertAppRoom(currentRoom),
			this.orch.getConverters().get('visitors').convertAppVisitor(visitor),
			{ userId: targetAgent.id, departmentId }
		);
	}

	async findVisitors(query, appId) {
		this.orch.debugLog(`The App ${ appId } is looking for livechat visitors.`);

		return LivechatVisitors.find(query).fetch().map((visitor) => this.orch.getConverters().get('visitors').convertVisitor(visitor));
	}
}
