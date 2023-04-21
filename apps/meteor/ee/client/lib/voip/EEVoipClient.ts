import type { ICallerInfo, IMediaStreamRenderer, VoIPUserConfiguration } from '@rocket.chat/core-typings';
import { Operation, UserState } from '@rocket.chat/core-typings';
import { Inviter, UserAgent } from 'sip.js';
import type { IncomingResponse } from 'sip.js/lib/core';

import { VoIPUser } from '../../../../client/lib/voip/VoIPUser';

export class EEVoipClient extends VoIPUser {
	constructor(config: VoIPUserConfiguration, mediaRenderer?: IMediaStreamRenderer) {
		super(config, mediaRenderer);
	}

	async makeCallURI(calleeURI: string, mediaRenderer?: IMediaStreamRenderer): Promise<void> {
		if (mediaRenderer) {
			this.mediaStreamRendered = mediaRenderer;
		}
		if (this.session) {
			throw new Error('Session exists');
		}
		if (!this.userAgent) {
			throw new Error('No User Agent.');
		}
		if (this.callState !== 'REGISTERED') {
			throw new Error('Incorrect UA state');
		}
		const target = UserAgent.makeURI(calleeURI);
		if (!target) {
			throw new Error(`Failed to create valid URI ${calleeURI}`);
		}
		// Replace this when device manager code is ready.
		const constraints = {
			audio: true,
			video: false,
		};
		const inviterOptions = {
			sessionDescriptionHandlerOptions: { constraints },
		};
		// Create a new Inviter for the outgoing Session
		const inviter = new Inviter(this.userAgent, target, inviterOptions);
		this.session = inviter;
		this.setupSessionEventHandlers(inviter);
		this._opInProgress = Operation.OP_SEND_INVITE;

		await inviter.invite({
			requestDelegate: {
				onReject: (response: IncomingResponse): void => {
					if (response.message.reasonPhrase) {
						this.emit('callfailed', response.message.reasonPhrase || 'unknown');
					}
				},
			},
		});

		this._callState = 'OFFER_SENT';
		const callerInfo: ICallerInfo = {
			callerId: inviter.remoteIdentity.uri.user ? inviter.remoteIdentity.uri.user : '',
			callerName: inviter.remoteIdentity.displayName,
			host: inviter.remoteIdentity.uri.host,
		};
		this._callerInfo = callerInfo;
		this._userState = UserState.UAC;
		this.emit('stateChanged');
	}

	async makeCall(calleeNumber: string): Promise<void> {
		const hasPlusChar = calleeNumber.includes('+');

		const digits = calleeNumber.replace('+', '');
		this.makeCallURI(`sip:${hasPlusChar ? '*' : ''}${digits}@${this.userConfig.sipRegistrarHostnameOrIP}`);
	}

	static async create(config: VoIPUserConfiguration, mediaRenderer?: IMediaStreamRenderer): Promise<VoIPUser> {
		const voip = new EEVoipClient(config, mediaRenderer);
		await voip.init();
		return voip;
	}
}
