import type { IAppServerOrchestrator, IAppsLivechatMessage, IAppsMessage } from '@rocket.chat/apps';
import type { IExtraRoomParams } from '@rocket.chat/apps-engine/definition/accessors/ILivechatCreator';
import type { IVisitor, ILivechatRoom, ILivechatTransferData, IDepartment } from '@rocket.chat/apps-engine/definition/livechat';
import type { IMessage as IAppsEngineMessage } from '@rocket.chat/apps-engine/definition/messages';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';
import { LivechatBridge } from '@rocket.chat/apps-engine/server/bridges/LivechatBridge';
import type { ILivechatDepartment, IOmnichannelRoom, SelectedAgent, IMessage, ILivechatVisitor } from '@rocket.chat/core-typings';
import { OmnichannelSourceType } from '@rocket.chat/core-typings';
import { LivechatVisitors, LivechatRooms, LivechatDepartment, Users } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
import { deasyncPromise } from '../../../../server/deasync/deasync';
import { closeRoom } from '../../../livechat/server/lib/closeRoom';
import { setCustomFields } from '../../../livechat/server/lib/custom-fields';
import { getRoomMessages } from '../../../livechat/server/lib/getRoomMessages';
import { registerGuest } from '../../../livechat/server/lib/guests';
import type { ILivechatMessage } from '../../../livechat/server/lib/localTypes';
import { updateMessage, sendMessage } from '../../../livechat/server/lib/messages';
import { createRoom } from '../../../livechat/server/lib/rooms';
import { online } from '../../../livechat/server/lib/service-status';
import { transfer } from '../../../livechat/server/lib/transfer';
import { settings } from '../../../settings/server';

declare module '@rocket.chat/apps/dist/converters/IAppMessagesConverter' {
	export interface IAppMessagesConverter {
		convertMessage(message: IMessage, cacheObj?: object): Promise<IAppsMessage>;
	}
}

declare module '@rocket.chat/apps-engine/definition/accessors/ILivechatCreator' {
	interface IExtraRoomParams {
		customFields?: Record<string, unknown>;
	}
}

export class AppLivechatBridge extends LivechatBridge {
	constructor(private readonly orch: IAppServerOrchestrator) {
		super();
	}

	protected isOnline(departmentId?: string): boolean {
		// This function will be converted to sync inside the apps-engine code
		// TODO: Track Deprecation
		return deasyncPromise(online(departmentId));
	}

	protected async isOnlineAsync(departmentId?: string): Promise<boolean> {
		return online(departmentId);
	}

	protected async createMessage(message: IAppsLivechatMessage, appId: string): Promise<string> {
		this.orch.debugLog(`The App ${appId} is creating a new message.`);

		if (!message.token) {
			throw new Error('Invalid token for livechat message');
		}

		// #TODO: #AppsEngineTypes - Remove explicit types and typecasts once the apps-engine definition/implementation mismatch is fixed.
		const guest = this.orch.getConverters().get('visitors').convertAppVisitor(message.visitor);
		const appMessage = (await this.orch.getConverters().get('messages').convertAppMessage(message)) as IMessage | undefined;
		const livechatMessage = appMessage as ILivechatMessage | undefined;

		const msg = await sendMessage({
			guest: guest as ILivechatVisitor,
			message: livechatMessage as ILivechatMessage,
			agent: undefined,
			roomInfo: {
				source: {
					type: OmnichannelSourceType.APP,
					id: appId,
					alias: this.orch.getManager()?.getOneById(appId)?.getNameSlug(),
				},
			},
		});

		return msg._id;
	}

	protected async getMessageById(messageId: string, appId: string): Promise<IAppsLivechatMessage> {
		this.orch.debugLog(`The App ${appId} is getting the message: "${messageId}"`);

		const message = await this.orch.getConverters().get('messages').convertById(messageId);

		// #TODO: #AppsEngineTypes - Remove explicit types and typecasts once the apps-engine definition/implementation mismatch is fixed.
		return message as IAppsLivechatMessage;
	}

	protected async updateMessage(message: IAppsLivechatMessage, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is updating a message.`);

		const data = {
			guest: message.visitor,
			message: await this.orch.getConverters()?.get('messages').convertAppMessage(message),
		};

		// @ts-expect-error IVisitor vs ILivechatVisitor :(
		await updateMessage(data);
	}

	protected async createRoom(
		visitor: IVisitor,
		agent: IUser,
		appId: string,
		{ source, customFields }: IExtraRoomParams = {},
	): Promise<ILivechatRoom> {
		this.orch.debugLog(`The App ${appId} is creating a livechat room.`);

		let agentRoom: SelectedAgent | undefined;
		if (agent?.id) {
			const user = await Users.getAgentInfo(agent.id, settings.get('Livechat_show_agent_email'));
			if (!user) {
				throw new Error(`The agent with id "${agent.id}" was not found.`);
			}
			agentRoom = { agentId: user._id, username: user.username };
		}

		const room = await createRoom({
			visitor: this.orch.getConverters()?.get('visitors').convertAppVisitor(visitor),
			roomInfo: {
				source: {
					type: OmnichannelSourceType.APP,
					id: appId,
					alias: this.orch.getManager()?.getOneById(appId)?.getName(),
					...(source &&
						source.type === 'app' && {
							sidebarIcon: source.sidebarIcon,
							defaultIcon: source.defaultIcon,
							label: source.label,
							destination: source.destination,
						}),
				},
			},
			agent: agentRoom,
			extraData: customFields && { customFields },
		});

		// #TODO: #AppsEngineTypes - Remove explicit types and typecasts once the apps-engine definition/implementation mismatch is fixed.
		return this.orch.getConverters()?.get('rooms').convertRoom(room) as Promise<ILivechatRoom>;
	}

	protected async closeRoom(room: ILivechatRoom, comment: string, closer: IUser | undefined, appId: string): Promise<boolean> {
		this.orch.debugLog(`The App ${appId} is closing a livechat room.`);

		const user = closer && this.orch.getConverters()?.get('users').convertToRocketChat(closer);
		const visitor = this.orch.getConverters()?.get('visitors').convertAppVisitor(room.visitor);

		const closeData: any = {
			room: await this.orch.getConverters()?.get('rooms').convertAppRoom(room),
			comment,
			...(user && { user }),
			...(visitor && { visitor }),
		};

		await closeRoom(closeData);

		return true;
	}

	protected async findOpenRoomsByAgentId(agentId: string, appId: string): Promise<ILivechatRoom[]> {
		this.orch.debugLog(`The App ${appId} is looking for livechat rooms associated with agent ${agentId}`);

		if (!agentId) {
			throw new Error('Invalid agentId');
		}

		const rooms = await LivechatRooms.findOpenByAgent(agentId).toArray();
		return Promise.all(rooms.map((room) => this.orch.getConverters()?.get('rooms').convertRoom(room) as Promise<ILivechatRoom>));
	}

	protected async countOpenRoomsByAgentId(agentId: string, appId: string): Promise<number> {
		this.orch.debugLog(`The App ${appId} is counting livechat rooms associated with agent ${agentId}`);

		if (!agentId) {
			throw new Error('Invalid agentId');
		}

		return LivechatRooms.countOpenByAgent(agentId);
	}

	protected async findRooms(visitor: IVisitor, departmentId: string | null, appId: string): Promise<Array<ILivechatRoom>> {
		this.orch.debugLog(`The App ${appId} is looking for livechat visitors.`);

		if (!visitor) {
			return [];
		}

		let result;

		const extraQuery = await callbacks.run('livechat.applyRoomRestrictions', {});

		if (departmentId) {
			result = await LivechatRooms.findOpenByVisitorTokenAndDepartmentId(visitor.token, departmentId, {}, extraQuery).toArray();
		} else {
			result = await LivechatRooms.findOpenByVisitorToken(visitor.token, {}, extraQuery).toArray();
		}

		// #TODO: #AppsEngineTypes - Remove explicit types and typecasts once the apps-engine definition/implementation mismatch is fixed.
		return Promise.all(result.map((room) => this.orch.getConverters()?.get('rooms').convertRoom(room) as Promise<ILivechatRoom>));
	}

	protected async createVisitor(visitor: IVisitor, appId: string): Promise<string> {
		this.orch.debugLog(`The App ${appId} is creating a livechat visitor.`);

		const registerData = {
			department: visitor.department,
			username: visitor.username,
			name: visitor.name,
			token: visitor.token,
			email: '',
			connectionData: undefined,
			id: visitor.id,
			...(visitor.phone?.length && { phone: { number: visitor.phone[0].phoneNumber } }),
			...(visitor.visitorEmails?.length && { email: visitor.visitorEmails[0].address }),
		};

		const livechatVisitor = await registerGuest(registerData);

		if (!livechatVisitor) {
			throw new Error('Invalid visitor, cannot create');
		}

		return livechatVisitor._id;
	}

	protected async createAndReturnVisitor(visitor: IVisitor, appId: string): Promise<IVisitor | undefined> {
		this.orch.debugLog(`The App ${appId} is creating a livechat visitor.`);

		const registerData = {
			department: visitor.department,
			username: visitor.username,
			name: visitor.name,
			token: visitor.token,
			email: '',
			connectionData: undefined,
			id: visitor.id,
			...(visitor.phone?.length && { phone: { number: visitor.phone[0].phoneNumber } }),
			...(visitor.visitorEmails?.length && { email: visitor.visitorEmails[0].address }),
		};

		const livechatVisitor = await registerGuest(registerData);

		return this.orch.getConverters()?.get('visitors').convertVisitor(livechatVisitor);
	}

	protected async transferVisitor(visitor: IVisitor, transferData: ILivechatTransferData, appId: string): Promise<boolean> {
		this.orch.debugLog(`The App ${appId} is transfering a livechat.`);

		if (!visitor) {
			throw new Error('Invalid visitor, cannot transfer');
		}

		const { targetAgent, targetDepartment: departmentId, currentRoom } = transferData;

		const appUser = await Users.findOneByAppId(appId, {});
		if (!appUser) {
			throw new Error('Invalid app user, cannot transfer');
		}
		const { _id, username, name, type } = appUser;
		const transferredBy = {
			_id,
			username,
			name,
			type,
			userType: 'user',
		} as const;

		let userId;
		let transferredTo;

		if (targetAgent?.id) {
			transferredTo = await Users.findOneAgentById(targetAgent.id, {
				projection: { _id: 1, username: 1, name: 1 },
			});
			if (!transferredTo) {
				throw new Error('Invalid target agent, cannot transfer');
			}

			userId = transferredTo._id;
		}

		// #TODO: #AppsEngineTypes - Remove explicit types and typecasts once the apps-engine definition/implementation mismatch is fixed.
		return transfer(
			(await this.orch.getConverters()?.get('rooms').convertAppRoom(currentRoom)) as IOmnichannelRoom,
			this.orch.getConverters()?.get('visitors').convertAppVisitor(visitor),
			{ userId, departmentId, transferredBy, transferredTo },
		);
	}

	protected async findVisitors(query: object, appId: string): Promise<Array<IVisitor>> {
		this.orch.debugLog(`The App ${appId} is looking for livechat visitors.`);

		if (this.orch.isDebugging()) {
			console.warn('The method AppLivechatBridge.findVisitors is deprecated. Please consider using its alternatives');
		}

		return Promise.all(
			(await LivechatVisitors.findEnabled(query).toArray()).map(
				async (visitor) => visitor && this.orch.getConverters()?.get('visitors').convertVisitor(visitor),
			),
		);
	}

	protected async findVisitorById(id: string, appId: string): Promise<IVisitor | undefined> {
		this.orch.debugLog(`The App ${appId} is looking for livechat visitors.`);

		return this.orch.getConverters()?.get('visitors').convertById(id);
	}

	protected async findVisitorByEmail(email: string, appId: string): Promise<IVisitor | undefined> {
		this.orch.debugLog(`The App ${appId} is looking for livechat visitors.`);

		return this.orch
			.getConverters()
			?.get('visitors')
			.convertVisitor(await LivechatVisitors.findOneGuestByEmailAddress(email));
	}

	protected async findVisitorByToken(token: string, appId: string): Promise<IVisitor | undefined> {
		this.orch.debugLog(`The App ${appId} is looking for livechat visitors.`);

		return this.orch
			.getConverters()
			?.get('visitors')
			.convertVisitor(await LivechatVisitors.getVisitorByToken(token, {}));
	}

	protected async findVisitorByPhoneNumber(phoneNumber: string, appId: string): Promise<IVisitor | undefined> {
		this.orch.debugLog(`The App ${appId} is looking for livechat visitors.`);

		return this.orch
			.getConverters()
			?.get('visitors')
			.convertVisitor(await LivechatVisitors.findOneVisitorByPhone(phoneNumber));
	}

	protected async findDepartmentByIdOrName(value: string, appId: string): Promise<IDepartment | undefined> {
		this.orch.debugLog(`The App ${appId} is looking for livechat departments.`);

		return this.orch
			.getConverters()
			?.get('departments')
			.convertDepartment(await LivechatDepartment.findOneByIdOrName(value, {}));
	}

	protected async findDepartmentsEnabledWithAgents(appId: string): Promise<Array<IDepartment>> {
		this.orch.debugLog(`The App ${appId} is looking for livechat departments.`);

		const converter = this.orch.getConverters()?.get('departments');
		// #TODO: #AppsEngineTypes - Remove explicit types and typecasts once the apps-engine definition/implementation mismatch is fixed.
		const boundConverter = converter.convertDepartment.bind(converter) as (_: ILivechatDepartment) => Promise<IDepartment>;

		return Promise.all((await LivechatDepartment.findEnabledWithAgents().toArray()).map(boundConverter));
	}

	protected async _fetchLivechatRoomMessages(appId: string, roomId: string): Promise<Array<IAppsEngineMessage>> {
		this.orch.debugLog(`The App ${appId} is getting the transcript for livechat room ${roomId}.`);
		const messageConverter = this.orch.getConverters()?.get('messages');

		if (!messageConverter) {
			throw new Error('Could not get the message converter to process livechat room messages');
		}

		const livechatMessages = await getRoomMessages({ rid: roomId });
		return Promise.all(await livechatMessages.map((message) => messageConverter.convertMessage(message, livechatMessages)).toArray());
	}

	protected async setCustomFields(
		data: { token: IVisitor['token']; key: string; value: string; overwrite: boolean },
		appId: string,
	): Promise<number> {
		this.orch.debugLog(`The App ${appId} is setting livechat visitor's custom fields.`);

		return setCustomFields(data);
	}
}
