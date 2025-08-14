import type { MediaCallActor, MediaCallSignedActor } from '@rocket.chat/core-typings';
import Srf, { type SrfResponse, type SrfRequest } from 'drachtio-srf';

import { gateway } from '../../../global/SignalGateway';

let sessionCount = 0;

export class SipServerSession {
	private readonly _sessionId: string;

	private srf: Srf;

	constructor() {
		sessionCount++;
		this._sessionId = `${sessionCount}-${Date.now().toString()}`;
		this.srf = new Srf();
		this.initializeDrachtio();
	}

	private initializeDrachtio(): void {
		// this.srf.connect({
		// 	host: '127.0.0.1',
		// 	port: 9022,
		// 	secret: 'cymru',
		// });

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

			this.processInvite(req, res).catch((error) => {
				console.error(error);
			});

			// try {
			// 	const freeswitchUri = `sip:1003@freeswitch:5060`;

			// 	console.log('forwarding call to extension 1003 on freeswitch');

			// 	console.log('Incoming SDP: ', req.body);

			// 	const { uac, uas } = await srf.createB2BUA(req, res, freeswitchUri, {
			// 		localSdpA: req.body,
			// 	});

			// 	if (uac.remote.sdp === req.body) {
			// 		console.log('uac.remote.sdp: same as incoming sdp');
			// 	} else {
			// 		console.log('uac.remote.sdp:', uac.remote.sdp);
			// 	}

			// 	if (uac.local.sdp === req.body) {
			// 		console.log('uac.local.sdp: same as incoming sdp');
			// 	} else if (uac.local.sdp === uac.remote.sdp) {
			// 		console.log('uac.local.sdp: same as uac.remote.sdp');
			// 	} else {
			// 		console.log('uac.local.sdp:', uac.local.sdp);
			// 	}

			// 	if (uas.remote.sdp === req.body) {
			// 		console.log('uas.remote.sdp: same as incoming sdp');
			// 	} else if (uas.remote.sdp === uac.remote.sdp) {
			// 		console.log('uas.remote.sdp: same as uac.remote.sdp');
			// 	} else if (uas.remote.sdp === uac.local.sdp) {
			// 		console.log('uas.remote.sdp: same as uac.local.sdp');
			// 	} else {
			// 		console.log('uas.remote.sdp:', uas.remote.sdp);
			// 	}

			// 	if (uas.local.sdp === req.body) {
			// 		console.log('uas.local.sdp: same as incoming sdp');
			// 	} else if (uas.local.sdp === uac.remote.sdp) {
			// 		console.log('uas.local.sdp: same as uac.remote.sdp');
			// 	} else if (uas.local.sdp === uac.local.sdp) {
			// 		console.log('uas.local.sdp: same as uac.local.sdp');
			// 	} else if (uas.local.sdp === uas.remote.sdp) {
			// 		console.log('uas.local.sdp: same as uas.remote.sdp');
			// 	} else {
			// 		console.log('uas.local.sdp:', uas.local.sdp);
			// 	}

			// 	console.log('Call bridged between caller and FreeSwitch');

			// 	uas.on('destroy', () => uac.destroy());
			// 	uac.on('destroy', () => uas.destroy());
			// } catch (err) {
			// 	console.error('Call failed', err);
			// 	res.send(480);
			// }
		});
	}

	private async processInvite(req: SrfRequest, _res: SrfResponse): Promise<void> {
		const callee = await gateway.mutateCallee(await this.getCalleeFromInvite(req));

		const caller: MediaCallSignedActor = {
			type: 'sip',
			id: req.callingNumber,
			contractId: this._sessionId,
		};

		const call = await gateway.createCall({
			callee,
			caller,
		});

		console.log(call);
	}

	private async getCalleeFromInvite(req: SrfRequest): Promise<MediaCallActor> {
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

		throw new Error('unrecognized-callee');
	}
}
