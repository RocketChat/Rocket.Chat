import type {
	MediaCallSignedContact,
	IMediaCall,
	IMediaCallChannel,
	MediaCallContactInformation,
	MediaCallContact,
} from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import type { SrfRequest, SrfResponse } from 'drachtio-srf';
import type Srf from 'drachtio-srf';

import { BaseSipCall } from './BaseSipCall';
import { MediaCallDirector } from '../../server/CallDirector';
import type { SipServerSession } from '../Session';
import { SipActorAgent } from '../agents/BaseSipAgent';
import type { SipActorCallerAgent } from '../agents/CallerAgent';
import { SipError, SipErrorCodes } from '../errorCodes';

type IncomingCallEvents = {
	gotRemoteDescription: void;
	callEnded: void;
	callFailed: void;
};

export class IncomingSipCall extends BaseSipCall {
	private readonly emitter: Emitter<IncomingCallEvents>;

	constructor(
		session: SipServerSession,
		call: IMediaCall,
		protected readonly agent: SipActorCallerAgent,
		channel: IMediaCallChannel,
	) {
		super(session, call, agent, channel);
		this.emitter = new Emitter();
	}

	public static async processInvite(session: SipServerSession, req: SrfRequest): Promise<IncomingSipCall> {
		console.log('process incoming sip call');
		if (!req.isNewInvite) {
			throw new SipError(SipErrorCodes.NOT_IMPLEMENTED, 'not-a-new-invite');
		}

		const callee = await this.getCalleeFromInvite(req);

		console.log('callee', callee);

		const caller = await this.getCallerContactFromInvite(session.sessionId, req);
		const localDescription = { type: 'offer', sdp: req.body } as const;

		const callerAgent = await MediaCallDirector.cast.getAgentForActorAndRole(caller, 'caller');
		if (!callerAgent) {
			throw new SipError(SipErrorCodes.NOT_FOUND, 'Caller agent not found');
		}

		if (!(callerAgent instanceof SipActorAgent)) {
			throw new SipError(SipErrorCodes.INTERNAL_SERVER_ERROR, 'Caller agent not valid');
		}

		const calleeAgent = await MediaCallDirector.cast.getAgentForActorAndRole(callee, 'callee');
		if (!calleeAgent) {
			throw new SipError(SipErrorCodes.NOT_FOUND, 'Callee agent not found');
		}

		const call = await MediaCallDirector.createCall({
			caller,
			callee,

			callerAgent,
			calleeAgent,

			webrtcOffer: localDescription,
		});

		const channel = await callerAgent.getOrCreateChannel(call, session.sessionId, {
			acknowledged: true,
			localDescription,
		});

		const sipCall = new IncomingSipCall(session, call, callerAgent, channel);

		// Send the call to the callee client
		await calleeAgent.onCallCreated(call);

		return sipCall;
	}

	public async createDialog(srf: Srf, req: SrfRequest, res: SrfResponse): Promise<Srf.Dialog> {
		const uas = await srf.createUAS(req, res, {
			localSdp: () => this.getRemoteDescription(),
		});

		uas.on('destroy', () => {
			console.log('uas.destroy');
		});

		return uas;
	}

	private async getRemoteDescription(): Promise<string> {
		if (this.remoteDescription) {
			if (!this.remoteDescription.sdp) {
				throw new Error('invalid-description');
			}

			return this.remoteDescription.sdp;
		}

		let eventPromiseResolved = false;

		const eventPromise: Promise<string> = new Promise((resolve, reject) => {
			this.emitter.on('gotRemoteDescription', () => {
				console.log('gotRemoteDescription');
				if (eventPromiseResolved) {
					return;
				}
				eventPromiseResolved = true;
				if (!this.remoteDescription?.sdp) {
					return reject();
				}

				resolve(this.remoteDescription.sdp);
			});

			this.emitter.on('callFailed', () => {
				console.log('callFailed');
				if (eventPromiseResolved) {
					return;
				}
				eventPromiseResolved = true;
				reject('call-failed');
			});
			this.emitter.on('callEnded', () => {
				console.log('callEnded');
				if (eventPromiseResolved) {
					return;
				}
				eventPromiseResolved = true;
				reject('call-ended');
			});
		});

		return eventPromise;
	}

	protected async reflectCall(call: IMediaCall): Promise<void> {
		if (call.state === 'accepted' && this.lastCallState !== 'accepted' && call.webrtcAnswer) {
			return this.flagAsAccepted(call.webrtcAnswer);
		}

		if (call.state === 'hangup') {
			return this.processEndedCall();
		}
	}

	protected async processEndedCall(): Promise<void> {
		this.emitter.emit('callEnded');
		this.lastCallState = 'hangup';
	}

	private flagAsAccepted(remoteDescription: RTCSessionDescriptionInit): void {
		this.remoteDescription = remoteDescription;
		this.emitter.emit('gotRemoteDescription');
		this.lastCallState = 'accepted';
	}

	private static async getCalleeFromInvite(req: SrfRequest): Promise<MediaCallContact> {
		let foundAnyIdentifier = false;

		if (req.has('X-RocketChat-To-Uid')) {
			const userId = req.get('X-RocketChat-To-Uid');
			if (userId && typeof userId === 'string') {
				foundAnyIdentifier = true;

				const userContact = await MediaCallDirector.cast.getContactForUserId(userId, { requiredType: 'user' });
				if (userContact) {
					return userContact;
				}
			}
		}

		if (req.calledNumber && typeof req.calledNumber === 'string') {
			foundAnyIdentifier = true;
			const userContact = await MediaCallDirector.cast.getContactForExtensionNumber(req.calledNumber, { requiredType: 'user' });
			if (userContact) {
				return userContact;
			}
		}

		// If the invite had an id/extension but we couldn't match it to an user, respond with unavailable
		if (foundAnyIdentifier) {
			throw new SipError(SipErrorCodes.TEMPORARILY_UNAVAILABLE);
		}

		// If we couldn't even identify an id/extension from the invite, respond with not found
		throw new SipError(SipErrorCodes.NOT_FOUND);
	}

	private static async getRocketChatCallerFromInvite(req: SrfRequest): Promise<MediaCallContact | null> {
		if (req.has('X-RocketChat-From-Uid')) {
			const userId = req.get('X-RocketChat-From-Uid');

			if (userId && typeof userId === 'string') {
				const userContact = await MediaCallDirector.cast.getContactForUserId(userId, { preferredType: 'user' });
				if (userContact) {
					return userContact;
				}
			}
		}

		if (req.callingNumber && typeof req.callingNumber === 'string') {
			// #ToDo: Parse extension number from the callingNumber attribute
			const userContact = await MediaCallDirector.cast.getContactForExtensionNumber(req.callingNumber, { preferredType: 'sip' });
			if (userContact) {
				return userContact;
			}
		}

		return null;
	}

	private static async getCallerContactFromInvite(sessionId: string, req: SrfRequest): Promise<MediaCallSignedContact<'sip'>> {
		const callerBase = await this.getRocketChatCallerFromInvite(req);

		const displayNameFromHeader = req.has('X-RocketChat-Caller-Name') && req.get('X-RocketChat-Caller-Name');
		const usernameFromHeader = req.has('X-RocketChat-Caller-Username') && req.get('X-RocketChat-Caller-Username');

		const displayName = displayNameFromHeader || callerBase?.displayName || req.from;
		const username = usernameFromHeader || callerBase?.username || req.callingNumber;

		const sipExtension = req.callingNumber;

		const defaultContactInfo: MediaCallContactInformation = {
			username,
			sipExtension,
			displayName: displayName || sipExtension,
		};

		const contact = await MediaCallDirector.cast.getContactForExtensionNumber(sipExtension, { requiredType: 'sip' }, defaultContactInfo);

		if (contact) {
			return {
				...contact,
				contractId: sessionId,
			} as MediaCallSignedContact<'sip'>;
		}

		return {
			type: 'sip',
			id: sipExtension,
			contractId: sessionId,
			...defaultContactInfo,
		};
	}
}
