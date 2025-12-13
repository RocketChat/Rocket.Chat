import type { Socket } from 'net';

import type { IMediaCall, MediaCallContact } from '@rocket.chat/core-typings';
import type { ClientMediaSignalBody } from '@rocket.chat/media-signaling';
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

	public reactToCallUpdate(params: { callId: string; dtmf?: ClientMediaSignalBody<'dtmf'> }): void {
		const { callId, ...otherParams } = params;

		const sipCall = this.knownCalls.get(callId);
		if (!sipCall) {
			// If we don't know this call, then it's probably being handled by a session in some other server instance
			return;
		}

		sipCall.reactToCallChanges(otherParams).catch((err) => {
			logger.error({ msg: 'Failed to react to call changes', err, call: sipCall.call, otherParams });
		});
	}

	public reportInternalCallUpdate(callId: string): void {
		logger.debug({ msg: 'SipServerSession.reportInternalCallUpdate', callId });
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
		progressCallbacks?: {
			cbRequest?: (error: unknown, req: Srf.SrfRequest) => void;
			cbProvisional?: (provisionalRes: Srf.SrfResponse) => void;
		},
	): Promise<Srf.Dialog> {
		const uri = this.getExtensionUri(sipExtension);

		return this.srf.createUAC(uri, opts, progressCallbacks);
	}

	public geContactUri(contact: MediaCallContact): string {
		const sipExtension = contact.sipExtension || (contact.type === 'sip' && contact.id) || null;
		const username = contact.username && `user-${contact.username}`;
		const userId = contact.id && `user-${contact.id}`;

		const sipUsername = sipExtension || username || userId;

		return this.getExtensionUri(sipUsername || 'unknown');
	}

	public getExtensionUri(extension: string): string {
		const { host, port } = this.settings.sip.sipServer;
		if (!host) {
			throw new Error('Sip Server Host is not configured');
		}

		const portStr = port ? `:${port}` : '';
		return `sip:${extension}@${host}${portStr}`;
	}

	public stripDrachtioServerDetails(reqOrRes: Srf.SipMessage): Record<string, any> {
		const { _agent, socket: _socket, _req, _res, ...data } = reqOrRes as Record<string, any>;

		return data;
	}

	private isEnabledOnSettings(settings: IMediaCallServerSettings): boolean {
		return Boolean(settings.sip.enabled && settings.sip.drachtio.host && settings.sip.drachtio.secret);
	}

	private initializeDrachtio(): void {
		logger.debug('Initializing Drachtio');
		this.srf.on('connect', (err, hostport) => {
			if (err) {
				logger.error({ msg: 'Drachtio Connection Failed', err });
				return;
			}

			logger.debug({ msg: 'Connected to a drachtio server', hostport });
		});

		this.srf.on('error', (err: unknown, socket?: Socket) => this.onDrachtioError(err, socket));

		this.srf.use((req, _res, next) => {
			logger.debug({ msg: 'Incoming message from Drachtio', method: req.method, source: req.source_address });
			next();
		});

		this.srf.invite((req, res) => {
			logger.debug('Received a call on drachtio.');

			void this.processInvite(req, res).catch((err) => {
				logger.error({ msg: 'Error processing Drachtio Invite', err });
			});
		});
	}

	private connectDrachtio(): void {
		if (this.wasEverEnabled) {
			return;
		}

		const { host, port = 9022, secret } = this.settings.sip.drachtio;

		logger.info({ msg: 'Connecting to drachtio', host, port });

		this.wasEverEnabled = true;
		this.srf.connect({
			host,
			port,
			secret,
		});
	}

	private async processInvite(req: SrfRequest, res: SrfResponse): Promise<void> {
		if (!this.isEnabledOnSettings(this.settings)) {
			res.send(SipErrorCodes.SERVICE_NOT_AVAILABLE);
			return;
		}

		const sipCall = await IncomingSipCall.processInvite(this, this.srf, req, res).catch((e) => {
			this.forwardSipExceptionToResponse(e, res);
			throw e;
		});

		this.registerCall(sipCall);
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

	private onDrachtioError(err: unknown, socket?: Socket): void {
		logger.error({ msg: 'Drachtio Service Error', err });

		if (this.isEnabledOnSettings(this.settings)) {
			return;
		}

		try {
			this.srf.disconnect(socket);
		} catch {
			// Supress errors on socket disconnection
		}
	}
}
