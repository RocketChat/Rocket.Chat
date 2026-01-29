import type { IUser } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { isClientMediaSignal } from '@rocket.chat/media-signaling';
import type { CallRejectedReason, ClientMediaSignal, ClientMediaSignalBody, ServerMediaSignal } from '@rocket.chat/media-signaling';

import { mediaCallDirector } from './CallDirector';
import { getDefaultSettings } from './getDefaultSettings';
import { stripSensitiveDataFromSignal } from './stripSensitiveData';
import type { IMediaCallServer, IMediaCallServerSettings, MediaCallServerEvents } from '../definition/IMediaCallServer';
import { CallRejectedError, type GetActorContactOptions, type InternalCallParams } from '../definition/common';
import { InternalCallProvider } from '../internal/InternalCallProvider';
import { GlobalSignalProcessor } from '../internal/SignalProcessor';
import { logger } from '../logger';
import { SipServerSession } from '../sip/Session';

/**
 * Class used as gateway to send and receive signals to/from clients
 * The actual function used to send the signals needs to be set by the server
 */
export class MediaCallServer implements IMediaCallServer {
	private session: SipServerSession;

	private signalProcessor: GlobalSignalProcessor;

	private settings: IMediaCallServerSettings;

	public emitter: Emitter<MediaCallServerEvents>;

	constructor() {
		this.emitter = new Emitter();
		this.session = new SipServerSession();
		this.settings = getDefaultSettings();
		this.signalProcessor = new GlobalSignalProcessor();

		this.signalProcessor.emitter.on('signalRequest', ({ toUid, signal }) => {
			// Forward signal requests from the signal processor to the server
			this.sendSignal(toUid, signal);
		});
		this.signalProcessor.emitter.on('callRequest', ({ params }) => {
			this.requestCall(params).catch(() => null);
		});
	}

	public receiveSignal(fromUid: IUser['_id'], signal: ClientMediaSignal): void {
		if (!isClientMediaSignal(signal)) {
			logger.error({ msg: 'The Media Signal Server received an invalid client signal object' });
			throw new Error('invalid-signal');
		}

		this.signalProcessor.processSignal(fromUid, signal).catch((err) => {
			logger.error({ msg: 'Failed to process client signal', err, type: signal.type });
		});
	}

	public sendSignal(toUid: IUser['_id'], signal: ServerMediaSignal): void {
		logger.debug({ msg: 'MediaCallServer.sendSignal', toUid, signal: stripSensitiveDataFromSignal(signal) });

		this.emitter.emit('signalRequest', { toUid, signal });
	}

	public reportCallUpdate(params: { callId: string; dtmf?: ClientMediaSignalBody<'dtmf'> }): void {
		logger.debug({ msg: 'MediaCallServer.reportCallUpdate', params });

		this.emitter.emit('callUpdated', params);
	}

	public updateCallHistory(params: { callId: string }): void {
		logger.debug({ msg: 'MediaCallServer.updateCallHistory', params });

		this.emitter.emit('historyUpdate', params);
	}

	public async requestCall(params: InternalCallParams): Promise<void> {
		try {
			const fullParams = await this.parseCallContacts(params);

			await this.createCall(fullParams);
		} catch (error) {
			let rejectionReason: CallRejectedReason = 'unsupported';
			if (error && typeof error === 'object' && error instanceof CallRejectedError) {
				rejectionReason = error.callRejectedReason;
			} else {
				logger.error({ msg: 'Failed to create a requested call', params, err: error });
			}

			const originalId = params.requestedCallId || params.parentCallId;

			if (originalId && params.requestedBy?.type === 'user') {
				logger.info({ msg: 'Call Request Rejected', uid: params.requestedBy.id, rejectionReason });

				this.sendSignal(params.requestedBy.id, {
					type: 'rejected-call-request',
					callId: originalId,
					toContractId: params.requestedBy.contractId,
					reason: rejectionReason,
				});
			} else {
				throw error;
			}
		}
	}

	public async createCall(params: InternalCallParams): Promise<void> {
		logger.debug({ msg: 'MediaCallServer.createCall', params });

		if (params.callee.type === 'sip') {
			await this.session.createOutgoingCall(params);
			return;
		}

		await InternalCallProvider.createCall(params);
	}

	public receiveCallUpdate(params: { callId: string; dtmf?: ClientMediaSignalBody<'dtmf'> }): void {
		this.session.reactToCallUpdate(params);
	}

	public async hangupExpiredCalls(): Promise<void> {
		return mediaCallDirector.hangupExpiredCalls();
	}

	public scheduleExpirationCheck(): void {
		mediaCallDirector.scheduleExpirationCheck();
	}

	public configure(settings: IMediaCallServerSettings): void {
		logger.debug({ msg: 'Media Server Configuration' });
		this.session.configure(settings);
		this.settings = settings;
	}

	public async permissionCheck(uid: IUser['_id'], callType: 'internal' | 'external' | 'any'): Promise<boolean> {
		return this.settings.permissionCheck(uid, callType);
	}

	/**
	 * Receives params for a call a client wishes to do, with actors needing only their basic identification
	 * Returns params for a call that should actually be done, according to server routing rules
	 * Returned value also include full contact information for the actors, when such information is available on the server
	 *
	 * Will throw if a call can't be routed or if one of the user lacks permission for it.
	 * Blocked permissions do not affect the routing rules, meaning a call may be blocked even if it would have been allowed through a different route.
	 * */
	private async parseCallContacts(params: InternalCallParams): Promise<InternalCallParams> {
		// On call transfers, do not mutate the caller
		// On new calls, force the caller type to be 'user' (since the call is being created in rocket.chat first)
		const isTransfer = Boolean(params.parentCallId);
		const callerRequiredType = isTransfer ? params.caller.type : 'user';

		const requester = params.requestedBy || params.caller;

		// Internal and outgoing calls must have been requested by an internal user;
		// Incoming calls should not be passing through this function.
		if (requester.type !== 'user') {
			logger.warn('Invalid call requester');
			throw new CallRejectedError('invalid-call-params');
		}
		// If this user can't make any call at all, fail early to avoid leaking if the callee is valid.
		if (!(await this.settings.permissionCheck(requester.id, 'any'))) {
			logger.debug({ msg: 'User with no permission requested a call.', uid: requester.id });
			throw new CallRejectedError('forbidden');
		}

		const caller = await mediaCallDirector.cast.getContactForActor(params.caller, { requiredType: callerRequiredType });
		if (!caller) {
			logger.debug('Failed to load caller contact information');
			throw new CallRejectedError('invalid-call-params');
		}

		// The callee contact type will determine if the call is going to go through SIP or directly to another rocket.chat user
		const callee = await mediaCallDirector.cast.getContactForActor(params.callee, this.getCalleeContactOptions());
		if (!callee) {
			logger.debug('Failed to load callee contact information');
			throw new CallRejectedError('invalid-call-params');
		}

		if (this.settings.internalCalls.requireExtensions && !callee.sipExtension) {
			logger.debug('Invalid target user');
			throw new CallRejectedError('invalid-call-params');
		}

		if (callee.type === 'user') {
			if (!(await this.settings.permissionCheck(requester.id, 'internal'))) {
				logger.debug('Requester lacks permission');
				throw new CallRejectedError('forbidden');
			}
			if (!(await this.settings.permissionCheck(callee.id, 'internal'))) {
				logger.debug('Callee lacks permission');
				throw new CallRejectedError('forbidden');
			}
			if (caller.type === 'user' && caller.id !== requester.id && !(await this.settings.permissionCheck(caller.id, 'internal'))) {
				logger.debug('Caller lacks permission');
				throw new CallRejectedError('forbidden');
			}
		} else {
			if (caller.type !== 'user') {
				logger.debug('Invalid call direction: user initiating a sip->user call');
				throw new CallRejectedError('invalid-call-params');
			}

			if (!(await this.settings.permissionCheck(requester.id, 'external'))) {
				logger.debug('Requester lacks permission');
				throw new CallRejectedError('forbidden');
			}
		}

		return {
			...params,
			caller: {
				...caller,
				contractId: params.caller.contractId,
			},
			callee,
		};
	}

	private getCalleeContactOptions(): GetActorContactOptions {
		if (!this.settings.sip.enabled) {
			return {
				requiredType: 'user',
			};
		}

		switch (this.settings.internalCalls.routeExternally) {
			case 'always':
				// Will only make sip calls
				return {
					requiredType: 'sip',
				};
			case 'never':
				// Will not use sip when calling an user or an extension assigned to an user, but will use sip when calling an unassigned extension
				return {
					preferredType: 'user',
				};
			case 'preferably':
				// Will only skip sip for users that don't have an assigned extension (or not call at all if `requireExtensions` is true)
				return {
					preferredType: 'sip',
				};

			default:
				return {};
		}
	}
}
