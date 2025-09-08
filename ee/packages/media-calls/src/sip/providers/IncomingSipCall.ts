import type {
	MediaCallSignedContact,
	IMediaCall,
	MediaCallContactInformation,
	MediaCallContact,
	IMediaCallChannel,
} from '@rocket.chat/core-typings';
import type { SipMessage, SrfRequest, SrfResponse } from 'drachtio-srf';
import type Srf from 'drachtio-srf';

import { BaseSipCall } from './BaseSipCall';
import { logger } from '../../logger';
import { BroadcastActorAgent } from '../../server/BroadcastAgent';
import { MediaCallDirector } from '../../server/CallDirector';
import type { SipServerSession } from '../Session';
import { SipError, SipErrorCodes } from '../errorCodes';

export class IncomingSipCall extends BaseSipCall {
	protected localDescription: RTCSessionDescriptionInit;

	protected remoteDescription: RTCSessionDescriptionInit | null;

	private sipDialog: Srf.Dialog | null;

	private responseSent = false;

	constructor(
		session: SipServerSession,
		call: IMediaCall,
		protected readonly agent: BroadcastActorAgent,
		channel: IMediaCallChannel,
		private readonly srf: Srf,
		private readonly req: SrfRequest,
		private readonly res: SrfResponse,
		localDescription: RTCSessionDescriptionInit,
	) {
		super(session, call, agent, channel);
		this.localDescription = localDescription;
		this.remoteDescription = null;
		this.sipDialog = null;
	}

	public static async processInvite(session: SipServerSession, srf: Srf, req: SrfRequest, res: SrfResponse): Promise<IncomingSipCall> {
		logger.debug({ msg: 'IncomingSipCall.processInvite' });
		if (!req.isNewInvite) {
			throw new SipError(SipErrorCodes.NOT_IMPLEMENTED, 'not-a-new-invite');
		}

		let sipCall: IncomingSipCall | null = null;

		req.on('cancel', (message) => {
			sipCall?.cancel(message);
		});

		const callee = await this.getCalleeFromInvite(req);
		logger.debug({ msg: 'incoming call to', callee });

		const caller = await this.getCallerContactFromInvite(session.sessionId, req);
		logger.debug({ msg: 'incoming call from', caller });
		const webrtcOffer = { type: 'offer', sdp: req.body } as const;

		const callerAgent = await MediaCallDirector.cast.getAgentForActorAndRole(caller, 'caller');
		if (!callerAgent) {
			throw new SipError(SipErrorCodes.NOT_FOUND, 'Caller agent not found');
		}

		if (!(callerAgent instanceof BroadcastActorAgent)) {
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

			webrtcOffer,
		});

		const channel = await callerAgent.getOrCreateChannel(call, session.sessionId);

		sipCall = new IncomingSipCall(session, call, callerAgent, channel, srf, req, res, webrtcOffer);

		callerAgent.provider = sipCall;

		// Send the call to the callee client
		await calleeAgent.onCallCreated(call);

		return sipCall;
	}

	public async createDialog(localSdp: string): Promise<void> {
		logger.debug({ msg: 'IncomingSipCall.createDialog' });

		const uas = await this.srf.createUAS(this.req, this.res, {
			localSdp,
		});

		if (!uas) {
			logger.debug({ msg: 'IncomingSipCall.createDialog - dialog creation failed' });
			void MediaCallDirector.hangupByServer(this.call, 'failed-to-create-sip-dialog');
		}

		uas.on('destroy', () => {
			logger.debug({ msg: 'IncomingSipCall - uas.destroy' });
			this.sipDialog = null;
			void MediaCallDirector.hangup(this.call, this.agent, 'remote');
		});

		this.sipDialog = uas;
	}

	protected cancel(res: SipMessage): void {
		logger.debug({ msg: 'IncomingSipCall.cancel', res });

		void MediaCallDirector.hangup(this.call, this.agent, 'remote').catch(() => null);
	}

	protected async reflectCall(call: IMediaCall): Promise<void> {
		if (call.state === 'hangup') {
			return this.processEndedCall(call);
		}

		if (call.state === 'accepted' && this.lastCallState !== 'accepted' && call.webrtcAnswer) {
			return this.flagAsAccepted(call.webrtcAnswer);
		}
	}

	protected async processEndedCall(call: IMediaCall): Promise<void> {
		logger.debug({ msg: 'IncomingSipCall.processEndedCall' });

		switch (call.hangupReason) {
			case 'service-error':
				this.cancelPendingCall(SipErrorCodes.NOT_ACCEPTABLE_HERE);
				break;
			case 'rejected':
				this.cancelPendingCall(SipErrorCodes.DECLINED);
				break;
			default:
				this.cancelPendingCall(SipErrorCodes.TEMPORARILY_UNAVAILABLE);
				break;
		}

		if (this.lastCallState === 'hangup') {
			return;
		}

		const { sipDialog } = this;
		this.sipDialog = null;
		this.lastCallState = 'hangup';

		if (sipDialog) {
			sipDialog.destroy();
		}
	}

	private flagAsAccepted(remoteDescription: RTCSessionDescriptionInit): void {
		logger.debug({ msg: 'IncomingSipCall.flagAsAccepted' });
		this.remoteDescription = remoteDescription;
		if (remoteDescription.sdp) {
			this.lastCallState = 'accepted';

			void this.createDialog(remoteDescription.sdp).catch(() => {
				logger.error('Failed to create incoming call dialog.');
				this.hangupPendingCall(SipErrorCodes.INTERNAL_SERVER_ERROR);
			});
		}
	}

	private cancelPendingCall(errorCode: number): void {
		logger.debug({
			msg: 'IncomingSipCall.cancelPendingCall',
			errorCode,
			responseSent: this.responseSent,
			hasDialog: Boolean(this.sipDialog),
		});

		if (this.responseSent || this.sipDialog) {
			return;
		}

		this.responseSent = true;
		this.res.send(errorCode);
	}

	private hangupPendingCall(errorCode: number): void {
		logger.debug('IncomingSipCall.hangupPendingCall');

		this.cancelPendingCall(errorCode);
		void MediaCallDirector.hangupByServer(this.call, `sip-error-${errorCode}`);
	}

	private static async getCalleeFromInvite(req: SrfRequest): Promise<MediaCallContact> {
		logger.debug({ msg: 'IncomingSipCall.getCalleeFromInvite' });
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
		logger.debug({ msg: 'IncomingSipCall.getRocketChatCallerFromInvite' });
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
		logger.debug({ msg: 'IncomingSipCall.getCallerContactFromInvite' });
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
