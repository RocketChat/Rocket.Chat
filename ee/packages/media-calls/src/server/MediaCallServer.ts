import type { IUser } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { isClientMediaSignal } from '@rocket.chat/media-signaling';
import type { CallRejectedReason, ClientMediaSignal, ServerMediaSignal } from '@rocket.chat/media-signaling';

import { MediaCallDirector } from './CallDirector';
import type { IMediaCallServer, IMediaCallServerSettings, MediaCallServerEvents } from '../definition/IMediaCallServer';
import { CallRejectedError, type GetActorContactOptions, type InternalCallParams } from '../definition/common';
import { InternalCallProvider } from '../internal/InternalCallProvider';
import { GlobalSignalProcessor } from '../internal/SignalProcessor';
import { logger } from '../logger';
import { getDefaultSettings } from './getDefaultSettings';

/**
 * Class used as gateway to send and receive signals to/from clients
 * The actual function used to send the signals needs to be set by the server
 */
export class MediaCallServer implements IMediaCallServer {
	private signalProcessor: GlobalSignalProcessor;

	private settings: IMediaCallServerSettings;

	public emitter: Emitter<MediaCallServerEvents>;

	constructor() {
		this.emitter = new Emitter();
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
		logger.debug({ msg: 'MediaCallServer.receiveSignal', type: signal.type, fromUid });

		if (!isClientMediaSignal(signal)) {
			logger.error({ msg: 'The Media Signal Server received an invalid client signal object' });
			throw new Error('invalid-signal');
		}

		this.signalProcessor.processSignal(fromUid, signal).catch((error) => {
			logger.error({ msg: 'Failed to process client signal', error, type: signal.type });
		});
	}

	public sendSignal(toUid: IUser['_id'], signal: ServerMediaSignal): void {
		logger.debug({ msg: 'MediaCallServer.sendSignal', toUid, type: signal.type });

		this.emitter.emit('signalRequest', { toUid, signal });
	}

	public async requestCall(params: InternalCallParams): Promise<void> {
		const fullParams = await this.fillContactInformationForNewCall(params);
		try {
			await this.createCall(fullParams);
		} catch (error) {
			let rejectionReason: CallRejectedReason = 'unsupported';
			if (error && typeof error === 'object' && error instanceof CallRejectedError) {
				rejectionReason = error.callRejectedReason;
			} else {
				logger.error({ msg: 'Failed to create a requested call', params, error });
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
			throw new Error('Outgoing SIP calls are not yet implemented.');
		}

		await InternalCallProvider.createCall(params);
	}

	public async hangupExpiredCalls(): Promise<void> {
		return MediaCallDirector.hangupExpiredCalls();
	}

	public scheduleExpirationCheck(): void {
		MediaCallDirector.scheduleExpirationCheck();
	}

	public configure(settings: IMediaCallServerSettings): void {
		logger.debug({ msg: 'Media Server Configuration', settings });
		this.settings = settings;
	}

	private async fillContactInformationForNewCall(params: InternalCallParams): Promise<InternalCallParams> {
		logger.debug({ msg: 'MediaCallServer.getContactForNewCallActors', params });

		// On call transfers, do not mutate the caller
		// On new calls, force the caller type to be 'user' (since the call is being created in rocket.chat first)
		const isTransfer = Boolean(params.parentCallId);
		const callerRequiredType = isTransfer ? params.caller.type : 'user';

		const caller = await MediaCallDirector.cast.getContactForActor(params.caller, { requiredType: callerRequiredType });
		if (!caller) {
			throw new Error('Failed to load caller contact information');
		}

		// The callee contact type will determine if the call is going to go through SIP or directly to another rocket.chat user
		const callee = await MediaCallDirector.cast.getContactForActor(params.callee, this.getCalleeContactOptions());
		if (!callee) {
			throw new Error('Failed to load callee contact information.');
		}

		if (this.settings.internalCalls.requireExtensions && !callee.sipExtension) {
			throw new Error('Invalid target user');
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
		}

		return {};
	}
}
