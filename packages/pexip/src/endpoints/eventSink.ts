import { VideoConf } from '@rocket.chat/core-services';
import { VideoConferenceStatus } from '@rocket.chat/core-typings';
import { callServer } from '@rocket.chat/media-calls';
import { MediaCalls, VideoConference as VideoConferenceModel } from '@rocket.chat/models';

import type { ConferenceEndedEventData, EventSinkRequest, ParticipantStatusEventData } from '../definition';
import { logger } from '../logger';
import { PexipEndpoint } from './endpoint';

export class EventSinkEndpoint extends PexipEndpoint {
	public async post(event: EventSinkRequest): Promise<void> {
		switch (event.event) {
			case 'conference_ended':
				return this.processConferenceEnded(event.data);
			case 'participant_connected':
				return this.processParticipantConnected(event.data);
		}
	}

	protected async processConferenceEnded(data: ConferenceEndedEventData): Promise<void> {
		try {
			// TODO: end call by sip alias
			await VideoConf.setStatus(data.name, VideoConferenceStatus.ENDED);
		} catch (err) {
			logger.error({ msg: 'Failed to flag conference as ended', err });
			// If the call was not found or we were unable to change the status, we probably received an alias instead of a callId
		}
	}

	protected async processParticipantConnected(data: ParticipantStatusEventData): Promise<void> {
		logger.debug({ msg: 'Pexip Participant Connected', data });

		const { destination_alias: conferenceUri, source_alias: participantUri, protocol, call_direction: direction } = data;
		if (!conferenceUri || direction !== 'in') {
			return;
		}

		const identification = this.getIdentificationFromAlias(conferenceUri);
		if (!identification) {
			return;
		}

		void this.confirmParticipantConnected(identification, protocol, participantUri).catch((err) => {
			logger.error({
				msg: 'Unexpected error while confirming call participant connected',
				err,
				method: 'EventSinkEndpoint.processParticipantConnected',
				identification,
				protocol,
				participantUri,
			});
		});
	}

	protected async confirmParticipantConnected(
		identification: string,
		protocol: ParticipantStatusEventData['protocol'],
		participantUri: string,
	): Promise<void> {
		switch (protocol) {
			case 'WebRTC':
				return this.confirmWebRTCParticipantConnected(identification);
			case 'SIP':
				return this.confirmSipParticipantConnected(identification, participantUri);
		}
	}

	protected async confirmWebRTCParticipantConnected(identification: string): Promise<void> {
		const call = await VideoConferenceModel.increaseWebRTCParticipantCount(identification);
		if (!call) {
			logger.error({
				msg: 'Failed to register WebRTC participant on conference',
				identification,
				method: 'EventSinkEndpoint.confirmWebRTCParticipantConnected',
			});
			return;
		}

		// Conference hasn't been escalated from two sides yet
		if (!call.mediaCallIds?.length || call.mediaCallIds.length < 2) {
			return;
		}

		if (!call.sipParticipantCount) {
			logger.warn({
				msg: 'Conference escalated from media call on both sides but no sip participant has connected to it',
				method: 'EventSinkEndpoint.confirmWebRTCParticipantConnected',
			});
			return;
		}

		if (!call.webrtcParticipantCount || call.webrtcParticipantCount < 2) {
			return;
		}

		const mediaCalls = await MediaCalls.findAllNotOverByCallIds(call.mediaCallIds).toArray();
		for (const mediaCall of mediaCalls) {
			if (mediaCall.escalatedAt && mediaCall.escalatedByPeerAt) {
				await callServer.hangupEscalatedCall(mediaCall).catch((err) => {
					logger.error({
						msg: 'Unexpected error while hanging up a fully escalated voice call',
						err,
						method: 'EventSinkEndpoint.confirmWebRTCParticipantConnected',
					});
				});
			}
		}
	}

	protected async confirmSipParticipantConnected(identification: string, participantUri: string): Promise<void> {
		const call = await VideoConferenceModel.increaseSipParticipantCount(identification);
		if (!call) {
			logger.error({
				msg: 'Failed to register SIP participant on conference',
				identification,
				participantUri,
				method: 'EventSinkEndpoint.confirmSipParticipantConnected',
			});
		}
	}
}
