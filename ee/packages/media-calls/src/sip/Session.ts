import type { IMediaCall } from '@rocket.chat/core-typings';
import { MediaCalls } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import Srf, { type SrfResponse, type SrfRequest } from 'drachtio-srf';

import { SipError } from './errorCodes';
import { logger } from '../logger';
import type { BaseSipCall } from './providers/BaseSipCall';
import { OutgoingSipCall } from './providers/OutgoingSipCall';
import { MediaCallDirector } from '../server/CallDirector';
import { IncomingSipCall } from './providers/IncomingSipCall';
import type { InternalCallParams } from '../definition/common';

export class SipServerSession {
	private readonly _sessionId: string;

	private srf: Srf;

	private knownCalls: Map<string, BaseSipCall>;

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

	public registerCall(call: BaseSipCall): void {
		this.knownCalls.set(call.callId, call);
	}

	public async createOutgoingCall(params: InternalCallParams): Promise<IMediaCall> {
		return OutgoingSipCall.createCall(this, params);
	}

	public async makeOutboundCall(call: IMediaCall, sdp: RTCSessionDescriptionInit): Promise<void> {
		if (call.callee.type !== 'sip') {
			throw new Error('invalid-callee');
		}

		const updateResult = await MediaCalls.startRingingById(call._id, MediaCallDirector.getNewExpirationTime());
		if (!updateResult.modifiedCount) {
			return;
		}

		const uri = `sip:${call.callee.id}@44.219.40.169:5060`;

		console.log('calling ', uri);

		const uac = await this.srf.createUAC(uri, {
			localSdp: sdp.sdp,
		});

		if (!uac) {
			console.log('failed');
			return;
		}

		console.log(`dialog established, call-id is ${uac.sip.callId}`);

		uac.on('destroy', () => {
			console.log('uac.destroy');
		});
	}

	private initializeDrachtio(): void {
		// #ToDo
		// setTimeout(() => {
		// 	console.log('connecting to drachtio');
		// 	this.srf.connect({
		// 		host: '172.19.0.2',
		// 		port: 9022,
		// 		secret: 'cymru',
		// 	});
		// }, 10000);

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
		const sipCall = await IncomingSipCall.processInvite(this, req).catch((e) => {
			this.forwardSipExceptionToResponse(e, res);
			throw e;
		});

		this.registerCall(sipCall);

		await sipCall.createDialog(this.srf, req, res);
	}

	private forwardSipExceptionToResponse(exception: unknown, res: SrfResponse): void {
		if (!exception || typeof exception !== 'object') {
			return;
		}

		if (!(exception instanceof SipError)) {
			return;
		}

		res.send(exception.sipErrorCode);
	}
}
