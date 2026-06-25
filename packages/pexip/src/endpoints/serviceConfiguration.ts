import { MediaCall } from '@rocket.chat/core-services';
import type { VideoConference } from '@rocket.chat/core-typings';
import { MediaCalls, VideoConference as VideoConferenceModel } from '@rocket.chat/models';

import type { ServiceConfiguration } from '../definition/ServiceConfiguration';
import type { SerializedServiceConfigurationRequest } from '../definition/ServiceConfigurationRequest';
import { logger } from '../logger';
import { PexipEndpoint } from './endpoint';

export class ServerConfigurationEndpoint extends PexipEndpoint {
	public async get(serviceRequest: SerializedServiceConfigurationRequest): Promise<ServiceConfiguration | null> {
		const { local_alias: alias, protocol = null, remote_alias: participantUri = null } = serviceRequest;
		logger.debug({ msg: 'Processing Pexip Policy Server Request', alias, protocol });

		if (!alias) {
			logger.error(`No call identification received in the request.`);
			return null;
		}

		const identification = this.getIdentificationFromAlias(alias);
		const participantSipUri = protocol === 'sip' ? participantUri : null;

		return this.getServiceConfigurationForIdentification(identification, participantSipUri);
	}

	private async getServiceConfigurationForIdentification(
		identification: string,
		participantSipUri: string | null,
	): Promise<ServiceConfiguration | null> {
		const call = await this.getCallByIdentification(identification);
		if (!call) {
			logger.error({ msg: 'Invalid call identification', identification });
			return null;
		}

		const conferenceTitle = 'title' in call && call.title;
		const title = conferenceTitle || 'Rocket.Chat';

		const [hostPin, guestPin] = await this.pexip.createAndStorePinsForCall(call);

		const canSkipPin = await this.detectVoiceCallEscalation(call, participantSipUri);
		const guestPinToUse = canSkipPin ? null : guestPin;

		return this.makeServiceConfiguration(call._id, title, hostPin, guestPinToUse);
	}

	private makeServiceConfiguration(name: string, title: string, hostPin: string, guestPin: string | null): ServiceConfiguration {
		const { customization } = this.pexip.settings;

		return {
			service_type: 'conference',
			name,
			service_tag: 'rocket.chat',
			description: title,
			...(hostPin ? { pin: hostPin } : {}),
			allow_guests: true,
			...(guestPin ? { guest_pin: guestPin } : {}),
			locked: customization.locked,
			ivr_theme_name: customization.themeName,
			call_type: 'video',
			view: customization.meetingLayout,
			local_display_name: title,
			enable_overlay_text: customization.overlayText,
		};
	}

	private async detectVoiceCallEscalation(conference: VideoConference, participantUri: string | null): Promise<boolean> {
		if (!participantUri) {
			return false;
		}

		const { sipAlias, mediaCallIds: linkedMediaCallIds } = conference;

		if (!sipAlias) {
			return false;
		}

		const participantSipExtension = this.getIdentificationFromAlias(participantUri);

		if (!participantSipExtension) {
			logger.debug({ msg: 'Someone connected to a Pexip Conference via SIP, but we could not identify them.' });
			return false;
		}

		logger.debug({
			msg: 'Pexip Participant joined via SIP',
			sipAlias: conference.sipAlias,
			conferenceId: conference._id,
			participantSipExtension,
		});

		const mediaCallIds = await MediaCalls.findAllNotOverByOppositeSipExtension(participantSipExtension, { projection: { _id: 1 } })
			.map(({ _id }) => _id)
			.toArray();

		if (mediaCallIds.length !== 1) {
			// Check if the user is already linked to the conference
			if (linkedMediaCallIds?.length) {
				if (await MediaCalls.isUserSipExtensionInCallIds(participantSipExtension, linkedMediaCallIds)) {
					return true;
				}
			}

			logger.debug({ msg: 'Could not identify the media call that the SIP Participant is connecting from', calls: mediaCallIds });
			return mediaCallIds.length > 0;
		}

		const [mediaCallId] = mediaCallIds;

		const updateResult = await VideoConferenceModel.addMediaCallIdByConferenceId(conference._id, mediaCallId);
		if (updateResult.modifiedCount) {
			await MediaCall.flagAsRemotelyEscalatedByCallId(mediaCallId);
		}

		return true;
	}
}
