import { Random } from 'meteor/random';

import { getRoom } from '../../../livechat/server/api/lib/livechat';
import { Livechat } from '../../../livechat/server/lib/Livechat';
import LivechatRooms from '../../../models/server/models/LivechatRooms';
import LivechatVisitors from '../../../models/server/models/LivechatVisitors';
import LivechatDepartment from '../../../models/server/models/LivechatDepartment';
import Users from '../../../models/server/models/Users';

export class AppLivechatBridge {
	constructor(orch) {
		this.orch = orch;
	}

	isOnline(department) {
		return Livechat.online(department);
	}

	async isOnlineAsync(department) {
		return Livechat.online(department);
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

		const msg = await Livechat.sendMessage(data);

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

		let agentRoom;
		if (agent && agent.id) {
			const user = Users.getAgentInfo(agent.id);
			agentRoom = Object.assign({}, { agentId: user._id });
		}

		const result = await getRoom({
			guest: this.orch.getConverters().get('visitors').convertAppVisitor(visitor),
			agent: agentRoom,
			rid: Random.id(),
		});

		return this.orch.getConverters().get('rooms').convertRoom(result.room);
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
			result = LivechatRooms.findOpenByVisitorTokenAndDepartmentId(visitor.token, departmentId).fetch();
		} else {
			result = LivechatRooms.findOpenByVisitorToken(visitor.token).fetch();
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

		const appUser = Users.findOneByAppId(appId);
		if (!appUser) {
			throw new Error('Invalid app user, cannot transfer');
		}
		const { _id, username, name, type } = appUser;
		const transferredBy = {
			_id,
			username,
			name,
			type,
		};

		return Livechat.transfer(
			this.orch.getConverters().get('rooms').convertAppRoom(currentRoom),
			this.orch.getConverters().get('visitors').convertAppVisitor(visitor),
			{ userId: targetAgent ? targetAgent.id : undefined, departmentId, transferredBy },
		);
	}

	async findVisitors(query, appId) {
		this.orch.debugLog(`The App ${ appId } is looking for livechat visitors.`);

		if (this.orch.isDebugging()) {
			console.warn('The method AppLivechatBridge.findVisitors is deprecated. Please consider using its alternatives');
		}

		return LivechatVisitors.find(query).fetch().map((visitor) => this.orch.getConverters().get('visitors').convertVisitor(visitor));
	}

	async findVisitorById(id, appId) {
		this.orch.debugLog(`The App ${ appId } is looking for livechat visitors.`);

		return this.orch.getConverters().get('visitors').convertById(id);
	}

	async findVisitorByEmail(email, appId) {
		this.orch.debugLog(`The App ${ appId } is looking for livechat visitors.`);

		return this.orch.getConverters().get('visitors').convertVisitor(LivechatVisitors.findOneGuestByEmailAddress(email));
	}

	async findVisitorByToken(token, appId) {
		this.orch.debugLog(`The App ${ appId } is looking for livechat visitors.`);

		return this.orch.getConverters().get('visitors').convertVisitor(LivechatVisitors.getVisitorByToken(token));
	}

	async findVisitorByPhoneNumber(phoneNumber, appId) {
		this.orch.debugLog(`The App ${ appId } is looking for livechat visitors.`);

		return this.orch.getConverters().get('visitors').convertVisitor(LivechatVisitors.findOneVisitorByPhone(phoneNumber));
	}

	async findDepartmentByIdOrName(value, appId) {
		this.orch.debugLog(`The App ${ appId } is looking for livechat departments.`);

		return this.orch.getConverters().get('departments').convertDepartment(LivechatDepartment.findOneByIdOrName(value));
	}
}
