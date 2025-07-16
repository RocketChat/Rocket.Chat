import type {
	IMediaCall,
	MediaCallUserChannel,
	MediaCallChannel,
	IUser,
	MediaCallActor,
	MediaCallChannelUserRC,
	MediaCallParticipant,
} from '@rocket.chat/core-typings';
import type { MediaSignal, MediaSignalDeliver, MediaSignalNotify, MediaSignalRequest } from '@rocket.chat/media-signaling';
import { Users, MediaCalls } from '@rocket.chat/models';

export class MediaSignalServer {
	private async processRequest(_signal: MediaSignalRequest): Promise<void> {
		//
	}

	private async processDeliver(_signal: MediaSignalDeliver): Promise<void> {
		//
	}

	private async processNotify(signal: MediaSignalNotify): Promise<void> {
		switch (signal.body.notify) {
			case 'ack':
				return this.processACK(signal as MediaSignalNotify<'ack'>);
		}
	}

	private async processACK(_signal: MediaSignalNotify<'ack'>): Promise<void> {
		//
	}

	private async preProcessSignal(signal: MediaSignal, uid: IUser['_id']): Promise<IMediaCall> {
		// Every time the server receives any signal, we need to check if the client that sent it is already in the call's channel list
		const call = await MediaCalls.findOneById(signal.callId);
		if (!call) {
			throw new Error('invalid-call');
		}

		const actor: MediaCallActor = { type: 'user', uid, sessionId: signal.sessionId };

		const existingChannel = call.userChannels.find((channel) => this.compareParticipantAndActor(channel.participant, actor));
		if (!existingChannel) {
			// There's no channel for this actor yet, so let's add one

			const user = await Users.findOneById(uid, { projection: { username: 1, name: 1 } });
			if (!user?.username) {
				throw new Error('invalid-user');
			}

			const role = this.getRoleForActor(call, actor);

			const newChannel: MediaCallUserChannel = {
				participant: {
					type: 'user',
					uid,
					username: user.username,
					displayName: user.name,
					sessionId: signal.sessionId,
				},
				role,
				state: 'none',
			};

			// #ToDo: Perhaps a separate collection would be better?
			await MediaCalls.addUserChannel(call._id, newChannel);
		}

		return call;
	}

	private getRoleForActor(call: IMediaCall, actor: MediaCallActor): MediaCallChannel['role'] {
		if (this.compareActorsIgnoringSession(call.caller, actor)) {
			return 'caller';
		}

		if (this.compareActorsIgnoringSession(call.callee, actor)) {
			return 'callee';
		}

		return 'none';
	}

	private compareActorsIgnoringSession(actor1: MediaCallActor, actor2: MediaCallActor): boolean {
		if (actor1.type === 'sip' && actor2.type === 'sip') {
			return actor1.username === actor2.username;
		}

		if (actor1.type === 'user' && actor2.type === 'user') {
			return actor1.uid === actor2.uid;
		}

		if (actor1.type === 'server' && actor2.type === 'server') {
			return true;
		}

		return false;
	}

	private compareParticipantAndActor(participant: MediaCallParticipant, actor: MediaCallActor): boolean {
		if (participant.type !== actor.type) {
			return false;
		}

		if (actor.type === 'sip') {
			return actor.username === participant.username;
		}

		if (actor.type === 'user') {
			const user = participant as MediaCallChannelUserRC;

			if (actor.uid !== user.uid) {
				return false;
			}

			return !actor.sessionId || actor.sessionId === user.sessionId;
		}

		return false;
	}

	private async getCallChannelForActor(
		call: IMediaCall,
		actor: MediaCallActor,
		{ autoAdd }: { autoAdd: boolean } = { autoAdd: false },
	): Promise<MediaCallChannel | undefined> {
		if (actor.type === 'server') {
			return undefined;
		}

		const existingChannel = call.userChannels.find((channel) => this.compareParticipantAndActor(channel.participant, actor));
		if (existingChannel) {
			return existingChannel;
		}

		if (!autoAdd) {
			return undefined;
		}
	}

	private async getSignalUserRole(_signal: MediaSignal, uid: IUser['_id'], call: IMediaCall): Promise<MediaCallChannel['role']> {
		if (call.caller.type === 'user' && call.caller.uid === uid) {
			return 'caller';
		}

		if (call.callee.type === 'user' && call.callee.uid === uid) {
			return 'callee';
		}

		// #ToDo: go through channels
		return 'none';
	}

	public async processSignal(signal: MediaSignal, uid: IUser['_id']) {
		console.log(signal);
		await this.preProcessSignal(signal, uid);

		switch (signal.type) {
			case 'request':
				await this.processRequest(signal);
				break;
			case 'deliver':
				await this.processDeliver(signal);
				break;
			case 'notify':
				await this.processNotify(signal);
				break;
		}
	}

	public async createCall(caller: MediaCallActor, callee: MediaCallActor): Promise<void> {
		if (caller.type !== 'user' || callee.type !== 'user') {
			throw new Error('not-implemented');
		}

		const callerUser = await Users.findOneById<Pick<IUser, '_id' | 'username' | 'name'>>(caller.uid, {
			projection: { username: 1, name: 1 },
		});

		if (!callerUser?.username) {
			throw new Error('invalid-caller');
		}

		const calleeUser = await Users.findOneById<Pick<IUser, '_id' | 'username' | 'name'>>(callee.uid, {
			projection: { username: 1, name: 1 },
		});
		if (!calleeUser?.username) {
			throw new Error('invalid-callee');
		}

		// Rocket.Chat users will have a separate channel entry for each session involved in the call
		// So if we don't have the sessionId of an user yet, do not initialize the channel
		const callerChannel: MediaCallUserChannel | null =
			(caller.sessionId && {
				participant: {
					type: 'user',
					uid: caller.uid,
					username: callerUser.username,
					displayName: callerUser.name,
					sessionId: caller.sessionId,
				},
				role: 'caller',
				state: 'none',
				joinedAt: new Date(),
			}) ||
			null;
		const calleeChannel: MediaCallUserChannel | null =
			(callee.sessionId && {
				participant: {
					type: 'user',
					uid: callee.uid,
					username: calleeUser.username,
					displayName: calleeUser.name,
					sessionId: callee.sessionId,
				},
				role: 'callee',
				state: 'none',
				joinedAt: new Date(),
			}) ||
			null;

		const call: Omit<IMediaCall, '_id' | '_updatedAt'> = {
			service: 'webrtc',
			kind: 'direct',
			state: 'none',

			createdBy: caller,
			createdAt: new Date(),

			caller,
			callee,

			userChannels: [...(callerChannel ? [callerChannel] : []), ...(calleeChannel ? [calleeChannel] : [])],
		};

		const insertResult = await MediaCalls.insertOne(call);

		console.log(insertResult);
	}
}
