import { VideoConf } from '@rocket.chat/core-services';
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

		const { destination_alias: conferenceUri, source_alias: participantUri, protocol } = data;
		if (protocol !== 'SIP' || !conferenceUri || !participantUri) {
			return;
		}
		const conferenceSipAlias = this.getIdentificationFromAlias(conferenceUri);
		const participantSipExtension = this.getIdentificationFromAlias(participantUri);

		if (!conferenceSipAlias || !participantSipExtension) {
			logger.debug({ msg: 'Someone connected to a Pexip Conference via SIP, but we could not identify them.' });
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
		await VideoConferenceModel.addMediaCallIdByProviderNameAndSipAlias('core.pexip', conferenceSipAlias, mediaCallId);
	}
}
