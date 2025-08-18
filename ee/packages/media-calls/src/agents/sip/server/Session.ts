import type { IMediaCall, MediaCallActor, MediaCallSignedContact } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import Srf, { type SrfResponse, type SrfRequest } from 'drachtio-srf';

import { SipErrorCodes } from './errorCodes';
import { gateway } from '../../../global/SignalGateway';
import { logger } from '../../../logger';
import { SipIncomingMediaCallProvider } from '../../../providers/sip/SipIncomingMediaCallProvider';
import { BaseSipMediaCallProvider } from '../../../providers/sip/BaseSipMediaCallProvider';
import { MediaCalls } from '@rocket.chat/models';
import { MediaCallMonitor } from '../../../global/CallMonitor';
import { InvalidParamsError } from '../../../providers/common';

export class SipServerSession {
	private readonly _sessionId: string;

	private srf: Srf;

	private knownCalls: Map<string, BaseSipMediaCallProvider>;

	public get sessionId(): string {
		return this._sessionId;
	}

	constructor() {
		this._sessionId = Random.id();
		this.knownCalls = new Map();
		this.srf = new Srf();
		this.initializeDrachtio();
	}

	public reactToCallUpdate(callId: string): void {
		const call = this.knownCalls.get(callId);
		if (!call) {
			// If we don't know this call, then it's probably being handled by a session in some other server instance
			return;
		}

		call.reactToCallChanges().catch((error) => {
			logger.error({ msg: 'Failed to react to call changes', error, callId });
		});
	}

	public reportInternalCallUpdate(callId: string): void {
		console.log(callId);
	}

	public registerCall(call: IMediaCall, provider: BaseSipMediaCallProvider): void {
		this.knownCalls.set(call._id, provider);
	}

	public async makeOutboundCall(call: IMediaCall, sdp: RTCSessionDescriptionInit): Promise<void> {
		if (call.callee.type !== 'sip') {
			throw new InvalidParamsError('invalid-callee');
		}

		const updateResult = await MediaCalls.startRingingById(call._id, MediaCallMonitor.getNewExpirationTime());
		if (!updateResult.modifiedCount) {
			return;
		}

		const uri = `sip:${call.callee.id}@freeswitch:5060`;

		const uac = await this.srf.createUAC(uri, {
			localSdp: sdp.sdp,
		});

		console.log(`dialog established, call-id is ${uac.sip.callId}`);

		uac.on('destroy', () => {
			console.log('uac.destroy');
		});
	}

	private initializeDrachtio(): void {
		// #ToDo
		setTimeout(() => {
			console.log('connecting to drachtio');
			this.srf.connect({
				host: '172.19.0.2',
				port: 9022,
				secret: 'cymru',
			});
		}, 10000);

		this.srf.on('connect', (err, hostport) => {
			if (err) {
				console.error('connection failed', err);
				return;
			}

			console.log(`connected to a drachtio server listening on: ${hostport}`);
		});

		this.srf.on('error', (err) => {
			console.error('error');
			console.error(err);
			void this.srf.disconnect();
		});

		this.srf.use((req, _res, next) => {
			console.log(`incoming ${req.method} from ${req.source_address}`);
			next();
		});

		// this.srf.options((req, res) => {
		// 	res.send(200);
		// });

		this.srf.invite((req, res) => {
			console.log('received call on drachtio');

			void this.processInvite(req, res).catch((error) => {
				console.error(error);
			});
		});
	}

	private async processInvite(req: SrfRequest, res: SrfResponse): Promise<void> {
		if (!req.isNewInvite) {
			console.log('not implemented');
			res.send(SipErrorCodes.NOT_IMPLEMENTED);
			return;
		}

		const originalCalle = this.getCalleeFromInvite(req);
		if (!originalCalle) {
			console.log('callee not found');
			res.send(SipErrorCodes.NOT_FOUND);
			return;
		}

		console.log('originalCalle', originalCalle);

		const callee = await gateway.mutateCallee(originalCalle);
		// If the call is coming in through SIP, the callee must be a rocket.chat user, otherwise, why is it even here?
		// but if we couldn't identify an user as a callee, the extension might simply not be assigned to anyone, so respond with a generic unavailable
		if (callee?.type !== 'user') {
			console.log('callee not identified');
			res.send(SipErrorCodes.TEMPORARILY_UNAVAILABLE);
			return;
		}

		console.log('callee', callee);

		const caller = this.getCallerContactFromInvite(req);
		const localDescription = { type: 'offer', sdp: req.body } as const;

		const provider = new SipIncomingMediaCallProvider(caller, localDescription);

		const call = await provider.createCall(callee);
		console.log(call);
		this.registerCall(call, provider);

		const uas = await this.srf.createUAS(req, res, {
			localSdp: () => {
				return new Promise((resolve, reject) => {
					let resolved = false;

					provider.emitter.on('gotRemoteDescription', ({ description }) => {
						console.log('gotRemoteDescription');
						if (resolved) {
							return;
						}
						if (!description.sdp) {
							reject();
						}

						resolved = true;
						resolve(description.sdp as string);
					});

					provider.emitter.on('callFailed', () => {
						console.log('callFailed');
						if (resolved) {
							return;
						}
						resolved = true;
						reject('call-failed');
					});

					provider.emitter.on('callEnded', () => {
						console.log('callEnded');
						if (resolved) {
							return;
						}
						resolved = true;
						reject('call-ended');
					});
				});
			},
		});

		uas.on('destroy', () => {
			console.log('uas.destroy');
		});
	}

	private getCallerContactFromInvite(req: SrfRequest): MediaCallSignedContact<'sip'> {
		const displayName = req.has('X-RocketChat-Caller-Name') && req.get('X-RocketChat-Caller-Name');

		return {
			type: 'sip',
			id: req.callingNumber,
			contractId: this._sessionId,
			username: req.from || req.callingNumber,
			sipExtension: req.callingNumber,
			displayName: displayName || req.callingNumber,
		};
	}

	private getCalleeFromInvite(req: SrfRequest): MediaCallActor | null {
		if (req.has('X-RocketChat-To-Uid')) {
			const userId = req.get('X-RocketChat-To-Uid');
			if (userId && typeof userId === 'string') {
				return {
					type: 'user',
					id: userId,
				};
			}
		}

		if (req.calledNumber && typeof req.calledNumber === 'string') {
			return {
				type: 'sip',
				id: req.calledNumber,
			};
		}

		return null;
	}
}
