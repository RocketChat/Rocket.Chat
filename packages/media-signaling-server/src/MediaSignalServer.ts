import type {
	IMediaCall,
	IMediaCallChannel,
	IUser,
	MediaCallActor,
	// MediaCallChannelUserRC,
	// MediaCallParticipant,
	AtLeast,
} from '@rocket.chat/core-typings';
import type { MediaSignal, MediaSignalDeliver, MediaSignalNotify, MediaSignalRequest, RequestParams } from '@rocket.chat/media-signaling';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { Users, MediaCalls, MediaCallChannels } from '@rocket.chat/models';

type ValidUser = AtLeast<Required<IUser>, '_id' | 'username' | 'name'>;

export class MediaSignalServer {
	private async processRequest(_signal: MediaSignalRequest): Promise<void> {
		//
	}

	private async processDeliver(_signal: MediaSignalDeliver): Promise<void> {
		//
	}

	private async processNotify(signal: MediaSignalNotify, call: IMediaCall, channel: IMediaCallChannel): Promise<void> {
		switch (signal.body.notify) {
			case 'ack':
				return this.processACK(signal as MediaSignalNotify<'ack'>, call, channel);
		}
	}

	private async processACK(_signal: MediaSignalNotify<'ack'>, call: IMediaCall, channel: IMediaCallChannel): Promise<void> {
		// If the call is still on an empty state and the signal reached a callee, change the state to 'ringing'

		if (channel.role === 'callee' && call.state === 'none') {
			const result = await MediaCalls.startRingingById(call._id);

			// If the state was changed, request an offer from the caller
			if (result.modifiedCount) {
				await this.requestOffer(call);
			}
		}
	}

	private async requestOffer(call: IMediaCall, params?: RequestParams<'offer'>): Promise<void> {
		if (call.caller.type !== 'user' || !call.caller.sessionId) {
			throw new Error('not-implemented');
		}

		await this.sendSignal(call, call.caller.id, {
			role: 'caller',
			sessionId: call.caller.sessionId,
			type: 'request',
			body: {
				request: 'offer',
				...params,
			},
		});
	}

	private async sendSignal(
		call: IMediaCall,
		uid: IUser['_id'],
		signal: Omit<MediaSignal, 'version' | 'sequence' | 'callId'>,
	): Promise<void> {
		console.log('sendSignal', call, uid, {
			...signal,
			version: 1,
			sequence: 1,
			callId: call._id,
		});
	}

	private async getChannelForSignal(signal: MediaSignal, call: IMediaCall, user: ValidUser): Promise<IMediaCallChannel> {
		const actor = { type: 'user', id: user._id, sessionId: signal.sessionId } as const;

		// Every time the server receives any signal, we need to check if the client that sent it is already in the call's channel list
		const existingChannel = await MediaCallChannels.findOneByCallIdAndParticipant(call._id, actor);

		if (existingChannel) {
			return existingChannel;
		}

		const role = this.getRoleForActor(call, actor);

		const newChannel: InsertionModel<IMediaCallChannel> = {
			callId: call._id,
			participant: {
				...actor,
				username: user.username,
				displayName: user.name,
			},
			role,
			state: 'none',
		};

		try {
			await MediaCallChannels.insertOne(newChannel);
		} catch (e) {
			// #ToDo: Check if it was really a race condition?
		}

		const insertedChannel = await MediaCallChannels.findOneByCallIdAndParticipant(call._id, actor);
		if (!insertedChannel) {
			throw new Error('failed-to-insert-channel');
		}

		return insertedChannel;
	}

	private getRoleForActor(call: IMediaCall, actor: MediaCallActor): IMediaCallChannel['role'] {
		if (this.compareActorsIgnoringSession(call.caller, actor)) {
			return 'caller';
		}

		if (this.compareActorsIgnoringSession(call.callee, actor)) {
			return 'callee';
		}

		return 'none';
	}

	private compareActorsIgnoringSession(actor1: MediaCallActor, actor2: MediaCallActor): boolean {
		return actor1.type === actor2.type && actor1.id === actor2.id;
	}

	public async processSignal(signal: MediaSignal, uid: IUser['_id']) {
		console.log(signal);

		const call = await MediaCalls.findOneById(signal.callId);
		if (!call) {
			throw new Error('invalid-call');
		}

		const user = await Users.findOneById<Pick<Required<IUser>, '_id' | 'username' | 'name'>>(uid, { projection: { username: 1, name: 1 } });
		if (!user?.username || !user?.name) {
			throw new Error('invalid-user');
		}

		const channel = await this.getChannelForSignal(signal, call, user);

		switch (signal.type) {
			case 'request':
				await this.processRequest(signal);
				break;
			case 'deliver':
				await this.processDeliver(signal);
				break;
			case 'notify':
				await this.processNotify(signal, call, channel);
				break;
		}
	}

	public async createCall(caller: MediaCallActor, callee: MediaCallActor): Promise<void> {
		if (caller.type !== 'user' || callee.type !== 'user') {
			throw new Error('not-implemented');
		}
		if (!caller.sessionId) {
			throw new Error('not-implemented');
		}

		const callerUser = await Users.findOneById<Pick<IUser, '_id' | 'username' | 'name'>>(caller.id, {
			projection: { username: 1, name: 1 },
		});

		if (!callerUser?.username) {
			throw new Error('invalid-caller');
		}

		const calleeUser = await Users.findOneById<Pick<IUser, '_id' | 'username' | 'name'>>(callee.id, {
			projection: { username: 1, name: 1 },
		});
		if (!calleeUser?.username) {
			throw new Error('invalid-callee');
		}

		const call: Omit<IMediaCall, '_id' | '_updatedAt'> = {
			service: 'webrtc',
			kind: 'direct',
			state: 'none',

			createdBy: caller,
			createdAt: new Date(),

			caller,
			callee,
		};

		const insertResult = await MediaCalls.insertOne(call);
		if (insertResult.insertedId) {
			await Promise.allSettled([
				this.createInitialChannel(insertResult.insertedId, caller, { role: 'caller' }, callerUser),
				this.createInitialChannel(insertResult.insertedId, callee, { role: 'callee' }, calleeUser),
			]);
		}

		console.log(insertResult);
	}

	private async createInitialChannel(
		callId: string,
		actor: MediaCallActor,
		channelData: Partial<InsertionModel<IMediaCallChannel>>,
		userData?: Pick<IUser, '_id' | 'name' | 'username'>,
	): Promise<void> {
		// Rocket.Chat users will have a separate channel entry for each session involved in the call
		// So if we don't have the sessionId of an user yet, do not initialize the channel
		if (actor.type !== 'user' || !actor.sessionId) {
			return;
		}

		if (!userData?.username || !userData.name) {
			return;
		}

		await MediaCallChannels.insertOne({
			role: 'none',
			...channelData,
			callId,
			participant: {
				type: 'user',
				id: userData._id,
				username: userData.username,
				displayName: userData.name,
				sessionId: actor.sessionId,
			},
			state: 'none',
			joinedAt: new Date(),
		});
	}
}
