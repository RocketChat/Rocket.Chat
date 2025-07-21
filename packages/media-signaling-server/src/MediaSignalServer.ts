import type { IMediaCall, IMediaCallChannel, IUser, MediaCallActor, ValidSignalChannel, AtLeast } from '@rocket.chat/core-typings';
import type {
	DeliverParams,
	MediaSignal,
	MediaSignalDeliver,
	MediaSignalNotify,
	MediaSignalRequest,
	RequestParams,
} from '@rocket.chat/media-signaling';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { Users, MediaCalls, MediaCallChannels } from '@rocket.chat/models';

type ValidUser = AtLeast<Required<IUser>, '_id' | 'username' | 'name'>;

export class MediaSignalServer {
	private async processRequest(_signal: MediaSignalRequest): Promise<void> {
		//
	}

	private async processDeliver(signal: MediaSignalDeliver, call: IMediaCall, channel: ValidSignalChannel): Promise<void> {
		switch (signal.body.deliver) {
			case 'sdp':
				return this.processSDP(signal as MediaSignalDeliver<'sdp'>, call, channel);
		}
	}

	private async processNotify(signal: MediaSignalNotify, call: IMediaCall, channel: ValidSignalChannel): Promise<void> {
		switch (signal.body.notify) {
			case 'ack':
				return this.processACK(signal as MediaSignalNotify<'ack'>, call, channel);
			case 'accept':
				return this.processAccept(signal as MediaSignalNotify<'accept'>, call, channel);
		}
	}

	private async processACK(_signal: MediaSignalNotify<'ack'>, call: IMediaCall, channel: ValidSignalChannel): Promise<void> {
		// If the call is still on an empty state and a signal reached a callee, change the state to 'ringing'

		if (channel.role === 'callee' && call.state === 'none') {
			const result = await MediaCalls.startRingingById(call._id);

			// If the state was changed, request an offer from the caller
			if (result.modifiedCount) {
				await this.requestOffer(channel);
			}
		}
	}

	private async processAccept(_signal: MediaSignalNotify<'accept'>, call: IMediaCall, channel: ValidSignalChannel): Promise<void> {
		if (channel.role === 'callee') {
			if (!this.compareActorsIgnoringSession(call.callee, channel.participant)) {
				// Someone else tried to accept the call... should we respond something?
				return;
			}
			const sessionId = (channel.participant.type === 'user' && channel.participant.sessionId) || undefined;

			const result = await MediaCalls.acceptCallById(call._id, sessionId);
			if (!result.modifiedCount) {
				// # nothing was changed by this acceptance... should we respond something?
				return;
			}

			const newSequence = await this.getNewCallSequence(channel.callId);
			await this.sendSignalToChannel(newSequence.sequence, channel, {
				type: 'notify',
				body: {
					notify: 'state',
					callState: 'accepted',
				},
			});

			const otherChannel = await this.getOppositeChannel(call, channel);
			if (otherChannel && this.isValidSignalChannel(otherChannel)) {
				await this.sendSignalToChannel(newSequence.sequence, otherChannel, {
					type: 'notify',
					body: {
						notify: 'state',
						callState: 'accepted',
					},
				});
			}

			return;
		}

		if (channel.role === 'caller' && call.caller.type === 'user' && !call.caller.sessionId) {
			const result = await MediaCalls.setCallerSessionIdById(call._id, channel.participant.sessionId);
			if (result.modifiedCount) {
				// #Todo: Calls initiated without a caller sessionId
			}
		}
	}

	private async getActorChannel(callId: IMediaCall['_id'], actor: MediaCallActor): Promise<IMediaCallChannel | null> {
		if (actor.type !== 'user') {
			throw new Error('not-implemented');
		}

		// If there is no sessionId yet, we can't determine which channel is going to be used by this actor
		if (!actor.sessionId) {
			return null;
		}

		return MediaCallChannels.findOneByCallIdAndParticipant(callId, actor);
	}

	private async getOppositeChannel(call: IMediaCall, channel: IMediaCallChannel): Promise<IMediaCallChannel | null> {
		switch (channel.role) {
			case 'callee':
				return this.getActorChannel(call._id, call.callee);
			case 'caller':
				return this.getActorChannel(call._id, call.caller);
			default:
				return null;
		}
	}

	private async processSDP(signal: MediaSignalDeliver<'sdp'>, call: IMediaCall, channel: ValidSignalChannel): Promise<void> {
		// Save the SDP for the local session of the channel
		await MediaCallChannels.setLocalWebRTCSession(channel._id, {
			description: signal.body.sdp,
			iceCandidates: [],
			iceGatheringComplete: Boolean(signal.body.endOfCandidates),
			assignSequence: signal.sequence,
		});

		// Find the opposite channel and save the SDP there as well
		const otherChannel = await this.getOppositeChannel(call, channel);
		if (otherChannel) {
			await this.setRemoteSDP(
				otherChannel,
				{
					sdp: signal.body.sdp,
					endOfCandidates: Boolean(signal.body.endOfCandidates),
				},
				signal.sequence,
			);
		}
	}

	private async requestOffer(channel: IMediaCallChannel, params?: RequestParams<'offer'>): Promise<void> {
		this.validateChannelForSignals(channel);

		const call = await this.getNewCallSequence(channel.callId);

		await this.sendSignalToChannel(call.sequence, channel, {
			type: 'request',
			body: {
				request: 'offer',
				...params,
			},
		});
	}

	private isValidSignalRole(channelRole: IMediaCallChannel['role']): channelRole is MediaSignal['role'] {
		return ['caller', 'callee'].includes(channelRole);
	}

	private isValidSignalChannel(channel: IMediaCallChannel): channel is ValidSignalChannel {
		return channel.participant.type === 'user';
	}

	private async getNewCallSequence(callId: IMediaCall['_id']): Promise<IMediaCall> {
		const call = await MediaCalls.getNewSequence(callId);
		if (!call) {
			throw new Error('failed-to-reserve-sequence');
		}

		return call;
	}

	private validateChannelForSignals(channel: IMediaCallChannel): asserts channel is ValidSignalChannel {
		if (channel.participant.type !== 'user') {
			throw new Error('not-implemented');
		}
		if (!channel.participant.sessionId) {
			throw new Error('SDP may only be sent to specific user sessions.');
		}
	}

	private async setRemoteSDP(channel: IMediaCallChannel, params: DeliverParams<'sdp'>, sequence: number): Promise<void> {
		await MediaCallChannels.setRemoteWebRTCSession(channel._id, {
			description: params.sdp,
			iceCandidates: [],
			iceGatheringComplete: Boolean(params.endOfCandidates),
			assignSequence: sequence,
		});

		if (channel.participant.type !== 'user') {
			// No need to send any signals if the remote participant is not a rocket.chat user
			return;
		}

		await this.deliverSDP(channel, {
			sdp: params.sdp,
			endOfCandidates: params.endOfCandidates,
		});
	}

	private async deliverSDP(channel: IMediaCallChannel, params: DeliverParams<'sdp'>): Promise<void> {
		this.validateChannelForSignals(channel);

		const call = await this.getNewCallSequence(channel.callId);

		// If the sdp is an offer, send an answer request, otherwise simply deliver it
		if (params.sdp.type === 'offer') {
			await this.sendSignalToChannel(call.sequence, channel, {
				type: 'request',
				body: {
					request: 'answer',
					offer: params.sdp,
				},
			});
		} else {
			await this.sendSignalToChannel(call.sequence, channel, {
				type: 'deliver',
				body: {
					deliver: 'sdp',
					...params,
				},
			});
		}
	}

	private async sendSignalToChannel(
		sequence: number,
		channel: ValidSignalChannel,
		signal: Omit<MediaSignal, 'version' | 'sequence' | 'callId' | 'role' | 'sessionId'>,
	): Promise<void> {
		if (!this.isValidSignalRole(channel.role)) {
			// Tried to send a signal to a channel that is neither the caller nor the callee... what to do?
			return;
		}

		await this.sendSignal({
			...signal,
			role: channel.role,
			sessionId: channel.participant.sessionId,
			version: 1,
			sequence,
			callId: channel.callId,
		} as MediaSignal);
	}

	private async sendSignal(signal: MediaSignal): Promise<void> {
		console.log('sendSignal', signal);
	}

	private async getChannelForSignal(signal: MediaSignal, call: IMediaCall, user: ValidUser): Promise<ValidSignalChannel> {
		const actor = { type: 'user', id: user._id, sessionId: signal.sessionId } as const;

		// Every time the server receives any signal, we need to check if the client that sent it is already in the call's channel list
		const existingChannel = await MediaCallChannels.findOneByCallIdAndParticipant(call._id, actor);

		if (existingChannel) {
			return existingChannel as ValidSignalChannel;
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

		return insertedChannel as ValidSignalChannel;
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
				await this.processDeliver(signal, call, channel);
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
			sequence: 0,

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
