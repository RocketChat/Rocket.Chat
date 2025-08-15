import type { MediaCallActor, MediaCallSignedContact } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import Srf, { type SrfResponse, type SrfRequest } from 'drachtio-srf';

import { SipErrorCodes } from './errorCodes';
import { gateway } from '../../../global/SignalGateway';
import { SipIncomingMediaCallProvider } from '../../../providers/sip/SipIncomingMediaCallProvider';

export class SipServerSession {
	private readonly _sessionId: string;

	private srf: Srf;

	constructor() {
		this._sessionId = Random.id();
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

			void this.processInvite(req, res).catch((error) => {
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

	private async processInvite(req: SrfRequest, res: SrfResponse): Promise<void> {
		if (!req.isNewInvite) {
			res.send(SipErrorCodes.NOT_IMPLEMENTED);
			return;
		}

		const originalCalle = this.getCalleeFromInvite(req);
		if (!originalCalle) {
			res.send(SipErrorCodes.NOT_FOUND);
			return;
		}

		const callee = await gateway.mutateCallee(originalCalle);
		// If the call is coming in through SIP, the callee must be a rocket.chat user, otherwise, why is it even here?
		// but if we couldn't identify an user as a callee, the extension might simply not be assigned to anyone, so respond with a generic unavailable
		if (callee?.type !== 'user') {
			res.send(SipErrorCodes.TEMPORARILY_UNAVAILABLE);
			return;
		}

		const caller = this.getCallerContactFromInvite(req);
		const localDescription = { type: 'offer', sdp: req.body } as const;

		const provider = new SipIncomingMediaCallProvider(caller, localDescription);

		const call = await provider.createCall(callee);
		console.log(call);

		// #ToDo: wait for an event that signals the call was accepted

		// const calleeAgent = await agentManager.getNewAgentForActor(callee, 'callee');
		// if (!calleeAgent) {
		// 	res.send(SipErrorCodes.TEMPORARILY_UNAVAILABLE);
		// 	return;
		// }

		// const factory = await SipAgentFactory.getAgentFactoryForExtension(
		// 	{ id: req.callingNumber, sipExtension: req.callingNumber },
		// 	this._sessionId,
		// );

		// if (!factory) {
		// 	res.send(SipErrorCodes.TEMPORARILY_UNAVAILABLE);
		// 	return;
		// }

		// const agent = factory.getNewAgent('caller');
		// agent.setDataFromInvite({
		// 	localDescription: { type: 'offer', sdp: req.body },
		// });

		// const caller: MediaCallSignedActor = {
		// 	type: 'sip',
		// 	id: req.callingNumber,
		// 	contractId: this._sessionId,
		// };

		// const requestedCallId = Random.id();

		// const call = await gateway.createCall({
		// 	callee,
		// 	caller,
		// 	requestedCallId,
		// 	callerAgent: agent,
		// });
		// console.log(call);

		// const callAgent = factory.getCallAgent(call);
		// // This shouldn't be possible
		// if (!callAgent) {
		// 	logger.error('Could not create the SIP caller agent.');
		// 	res.send(SipErrorCodes.INTERNAL_SERVER_ERROR);
		// 	calleeAgent.notify(call._id, 'hangup');
		// 	return;
		// }
		// console.log(callAgent);
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
