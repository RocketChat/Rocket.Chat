import { VideoConf, MediaCall } from '@rocket.chat/core-services';
import { VideoConferenceStatus } from '@rocket.chat/core-typings';
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

		const { destination_alias: conferenceUri, source_alias: participantUri, protocol, connect_time: participantConnectTime } = data;
		if (protocol !== 'SIP' || !conferenceUri || !participantUri) {
			return;
		}

		void this.detectVoiceCallEscalation(conferenceUri, participantUri, participantConnectTime).catch((err) => {
			logger.debug({ msg: 'Unexpected error checking wether Conference Participant is an escalated voice call.', err });
		});
	}

	private async detectVoiceCallEscalation(conferenceUri: string, participantUri: string, participantConnectTime: number): Promise<void> {
		const conferenceSipAlias = this.getIdentificationFromAlias(conferenceUri);
		const participantSipExtension = this.getIdentificationFromAlias(participantUri);

		if (!conferenceSipAlias || !participantSipExtension) {
			logger.debug({ msg: 'Someone connected to a Pexip Conference via SIP, but we could not identify them.' });
			return;
		}

		let connectTime: Date;
		try {
			connectTime = new Date(participantConnectTime * 1000);
			if (isNaN(connectTime.valueOf())) {
				throw new Error('invalid connect time');
			}
		} catch {
			logger.debug({ msg: 'Participant connect time could not be parsed' });
			return;
		}

		logger.debug({ msg: 'Pexip Participant joined via SIP', conferenceSipAlias, participantSipExtension });
		const mediaCallIds = await MediaCalls.findAllNotOverByOppositeSipExtension(participantSipExtension, { projection: { _id: 1 } })
			.map(({ _id }) => _id)
			.toArray();

		if (mediaCallIds.length !== 1) {
			logger.debug({ msg: 'Could not identify the media call that the SIP Participant is connecting from', calls: mediaCallIds });
			return;
		}

		const [mediaCallId] = mediaCallIds;
		// call must have been created before the user connected
		const maxCreatedAt = connectTime;
		// but no more than 1 minute before
		const minCreatedAt = new Date(connectTime.valueOf() - 60 * 1000);

		const conference = await VideoConferenceModel.addMediaCallIdByProviderNameAndSipAlias('core.pexip', conferenceSipAlias, mediaCallId, {
			minCreatedAt,
			maxCreatedAt,
		});
		if (conference) {
			await MediaCall.flagAsRemotelyEscalatedByCallId(mediaCallId);
		}
	}
}
