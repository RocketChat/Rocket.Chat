import type { DefaultEventMap } from '@rocket.chat/emitter';
import { Emitter } from '@rocket.chat/emitter';

import type { IWebRTCProcessor } from '../definition/IWebRTCProcessor';
import type { ClientMediaSignal, MediaSignal } from '../definition/MediaSignal';
import type { DeliverBody, DeliverParams, DeliverType, MediaSignalDeliver } from '../definition/MediaSignalDeliver';
import type { MediaSignalNotify, NotifyBody, NotifyParams, NotifyType } from '../definition/MediaSignalNotify';
import type { MediaSignalRequest } from '../definition/MediaSignalRequest';
import { createRandomToken } from './utils/createRandomToken';
import type { MediaSignalHeaderParams } from '../definition/MediaSignalHeader';

export class MediaSignalingSession<EventMap extends DefaultEventMap = DefaultEventMap> extends Emitter<EventMap> {
	private _sessionId: string;

	private _userId: string;

	private version = 1.0;

	private tricklingSignals = new Set<MediaSignal>();

	// #ToDo: handle processor
	private processor!: IWebRTCProcessor;

	public get agentId(): string {
		return `${this._userId}-${this._sessionId}`;
	}

	public get sessionId(): string {
		return this._sessionId;
	}

	public get userId(): string {
		return this._userId;
	}

	constructor(userId: string) {
		super();
		this._userId = userId;
		this._sessionId = createRandomToken(8);
	}

	private isSignalForUs(signal: MediaSignal): boolean {
		if (signal.sessionId) {
			return signal.sessionId === this._sessionId;
		}

		return true;
	}

	private async processRequest(signal: MediaSignalRequest) {
		if (!signal.sessionId) {
			throw new Error('Request signals MUST target a specific session.');
		}

		switch (signal.body.request) {
			case 'offer':
				return this.processOfferRequest(signal as MediaSignalRequest<'offer'>);
			case 'answer':
				return this.processAnswerRequest(signal as MediaSignalRequest<'answer'>);
			case 'sdp':
				return this.processSdpRequest(signal as MediaSignalRequest<'sdp'>);
		}
	}

	private async processOfferRequest(signal: MediaSignalRequest<'offer'>) {
		// #ToDo: processor
		let offer: DeliverParams<'sdp'> | null = null;
		try {
			offer = await this.processor.createOffer(signal.body);
		} catch (e) {
			this.sendError(signal, 'failed-to-create-offer');
			throw e;
		}

		if (!offer) {
			this.sendError(signal, 'implementation-error');
		}

		await this.deliverSdp(signal, offer);
	}

	private async processAnswerRequest(signal: MediaSignalRequest<'answer'>) {
		let answer: DeliverParams<'sdp'> | null = null;
		try {
			answer = await this.processor.createAnswer(signal.body);
		} catch (e) {
			this.sendError(signal, 'failed-to-create-answer');
			throw e;
		}

		if (!answer) {
			this.sendError(signal, 'implementation-error');
		}

		await this.deliverSdp(signal, answer);
	}

	private async processSdpRequest(signal: MediaSignalRequest<'sdp'>) {
		let sdp: DeliverParams<'sdp'> | null = null;
		try {
			sdp = await this.processor.collectLocalDescription(signal.body);
		} catch (e) {
			this.sendError(signal, 'failed-to-collect-description');
			throw e;
		}

		if (!sdp) {
			this.sendError(signal, 'implementation-error');
		}

		await this.deliverSdp(signal, sdp);
	}

	private async deliverSdp(requestSignal: MediaSignal, sdp: DeliverParams<'sdp'>) {
		// If we're trickling ICE, keep the signal reference for upcoming candidates
		if (!sdp.endOfCandidates) {
			this.tricklingSignals.add(requestSignal);
		}

		return this.deliverToServer(requestSignal, 'sdp', sdp);
	}

	private async processDeliver(signal: MediaSignalDeliver) {
		if (!signal.sessionId) {
			throw new Error('Delivery signals MUST target a specific session.');
		}

		switch (signal.body.deliver) {
			case 'sdp':
				await this.processor.setRemoteDescription(signal.body);
				break;
			case 'ice-candidates':
				await this.processor.addIceCandidates(signal.body);
				break;
			case 'dtmf':
				// #ToDo
				break;
		}
	}

	private async processNotify(signal: MediaSignalNotify) {
		switch (signal.body.notify) {
			case 'new':
				return this.processNewCall(signal, true);
			case 'error':
				break;
			case 'ack':
				break;
			// case 'invalid':
			// 	break;
			// case 'unable':
			// 	break;
			// case 'empty':
			// 	break;
			case 'state':
				break;
			case 'unavailable':
				break;
			case 'accept':
				break;
			case 'reject':
				break;
			case 'hangup':
				break;
			case 'negotiation-needed':
				break;
			case 'multi':
				break;
		}
	}

	private isCallKnown(_callId: string): boolean {
		return false;
	}

	private isSignalExpected(signal: MediaSignal): boolean {
		if (this.isCallKnown(signal.callId)) {
			return true;
		}

		if (signal.type === 'notify') {
			return signal.body.notify === 'new';
		}

		if (signal.type === 'request') {
			return ['offer', 'answer'].includes(signal.body.request);
		}

		return false;
	}

	private async initializePeerConnection() {
		await this.processor.initializePeerConnection();
	}

	private async processNewCall(signal: MediaSignal, isNewNotify = false) {
		// If we already know about this call, we don't need to process anything
		if (this.isCallKnown(signal.callId)) {
			return;
		}

		// #ToDo: Load call data from the server to get the current state, in case the call was already going for a while

		// If we are busy with another call, we can't take this one - though the server is supposed to know our state
		if (this.isBusy()) {
			if (signal.expectACK || isNewNotify) {
				return this.notifyServer(signal, 'unavailable');
			}
			return;
		}

		try {
			await this.initializePeerConnection();
		} catch (e) {
			this.sendError(signal, 'failed-to-initialize-peer');
			throw e;
		}

		// If we're free, ACK the new call
		if (signal.expectACK || isNewNotify) {
			this.sendACK(signal);
		}

		// If isNewNotify and role = 'callee', fire event for incoming call
	}

	private deliverToServer<T extends DeliverType>(requestSignal: MediaSignal, type: T, params: DeliverParams<T>) {
		return this.sendSignalToServer(
			{
				type: 'deliver',
				body: {
					deliver: type,
					...params,
				} as DeliverBody<T>,
			},
			requestSignal,
		);
	}

	private notifyServer<T extends NotifyType>(requestSignal: MediaSignal, type: T, params?: NotifyParams<T>) {
		return this.sendSignalToServer(
			{
				type: 'notify',
				body: {
					notify: type,
					...params,
				} as NotifyBody<T>,
			},
			requestSignal,
		);
	}

	private sendError(requestSignal: MediaSignal, errorCode: string, errorText?: string) {
		this.notifyServer(requestSignal, 'error', {
			errorCode,
			...(errorText && { errorText }),
		});
	}

	private sendACK(requestSignal: MediaSignal) {
		return this.notifyServer(requestSignal, 'ack');
	}

	private sendSignalToServer<T extends MediaSignal>(signal: ClientMediaSignal<T>, requestSignal: MediaSignal) {
		const header: MediaSignalHeaderParams = {
			callId: requestSignal.callId,
			sequence: requestSignal.sequence,
			role: requestSignal.role,
			version: this.version,
			sessionId: this._sessionId,
		};

		const newSignal = {
			...signal,
			...header,
		} as T;
		console.log(newSignal);
	}

	public isBusy(): boolean {
		return false;
	}

	public async processSignal(signal: MediaSignal) {
		if (!this.isSignalForUs(signal)) {
			return;
		}

		if (!this.isSignalExpected(signal)) {
			console.error('Unexpected Signal', signal);
			throw new Error('Unexpected Signal received.');
		}

		if (!this.isCallKnown(signal.callId)) {
			const isNewNotify = signal.type === 'notify' && signal.body.notify === 'new';

			await this.processNewCall(signal, isNewNotify);

			if (isNewNotify) {
				return;
			}
		}

		console.log(signal);
		switch (signal.type) {
			case 'request':
				await this.processRequest(signal);
				break;
			case 'deliver':
				await this.processDeliver(signal);
				break;
			case 'notify':
				await this.processNotify(signal);
				break;
		}
	}
}
