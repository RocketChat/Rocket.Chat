import type { IMediaCall } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import Srf, { type SrfResponse, type SrfRequest } from 'drachtio-srf';

import { SipError, SipErrorCodes } from './errorCodes';
import { logger } from '../logger';
import type { BaseSipCall } from './providers/BaseSipCall';
import { IncomingSipCall } from './providers/IncomingSipCall';
import { OutgoingSipCall } from './providers/OutgoingSipCall';
import type { IMediaCallServerSettings } from '../definition/IMediaCallServer';
import type { InternalCallParams } from '../definition/common';
import { getDefaultSettings } from '../server/getDefaultSettings';

export class SipServerSession {
	private readonly _sessionId: string;

	private srf: Srf;

	private knownCalls: Map<string, BaseSipCall>;

	private settings: IMediaCallServerSettings;

	private wasEverEnabled = false;

	public get sessionId(): string {
		return this._sessionId;
	}

	constructor() {
		this._sessionId = Random.id();
		this.knownCalls = new Map();
		this.srf = new Srf();
		// Always instantiate it with the default settings as it stays disconnected until explicitly configured
		this.settings = getDefaultSettings();
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

	public configure(settings: IMediaCallServerSettings): void {
		this.settings = settings;

		if (!this.isEnabledOnSettings(settings)) {
			return;
		}

		if (!this.wasEverEnabled) {
			this.connectDrachtio();
		}
	}

	public async createOutgoingCall(params: InternalCallParams): Promise<IMediaCall> {
		return OutgoingSipCall.createCall(this, params);
	}

	public async createSipDialog(
		sipExtension: string,
		opts: Srf.CreateUACOptions,
		progressCallbacks?: { cbRequest?: (req: Srf.SrfRequest) => void; cbProvisional?: (provisionalRes: Srf.SrfResponse) => void },
	): Promise<Srf.Dialog> {
		const { host, port } = this.settings.sip.sipServer;
		if (!host) {
			throw new Error('Sip Server Host is not configured');
		}

		const portStr = port ? `:${port}` : '';
		const uri = `sip:${sipExtension}@${host}${portStr}`;

		return this.srf.createUAC(uri, opts, progressCallbacks);
	}

	private isEnabledOnSettings(settings: IMediaCallServerSettings): boolean {
		return Boolean(settings.enabled && settings.sip.enabled && settings.sip.drachtio.host && settings.sip.drachtio.secret);
	}

	private initializeDrachtio(): void {
		console.log('initializeDrachtio');
		this.srf.on('connect', (err, hostport) => {
			if (err) {
				console.error('connection failed', err);
				return;
			}

			console.log(`connected to a drachtio server listening on: ${hostport}`);
		});

		// @ts-expect-error: The package is exporting wrong types
		this.srf.on('error', (err: Error, socket: unknown) => this.onDrachtioError(err, socket));

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

	private connectDrachtio(): void {
		if (this.wasEverEnabled) {
			return;
		}

		console.log('connecting to drachtio');
		this.wasEverEnabled = true;
		this.srf.connect({
			host: this.settings.sip.drachtio.host,
			port: this.settings.sip.drachtio.port ?? 9022,
			secret: this.settings.sip.drachtio.secret,
		});
	}

	private async processInvite(req: SrfRequest, res: SrfResponse): Promise<void> {
		if (!this.isEnabledOnSettings(this.settings)) {
			res.send(SipErrorCodes.SERVICE_NOT_AVAILABLE);
			return;
		}

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

	private onDrachtioError(error: Error, socket: unknown): void {
		console.error('error');
		console.error(error);

		if (this.isEnabledOnSettings(this.settings)) {
			return;
		}

		try {
			// @ts-expect-error: The package is exporting wrong types
			this.srf.disconnect(socket);
		} catch {
			// Supress errors on socket disconnection
		}
	}
}
