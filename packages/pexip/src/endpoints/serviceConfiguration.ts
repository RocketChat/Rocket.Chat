import type { ServiceConfiguration } from '../definition/ServiceConfiguration';
import type { SerializedServiceConfigurationRequest } from '../definition/ServiceConfigurationRequest';
import { logger } from '../logger';
import { PexipEndpoint } from './endpoint';

export class ServerConfigurationEndpoint extends PexipEndpoint {
	public async get(serviceRequest: SerializedServiceConfigurationRequest): Promise<ServiceConfiguration | null> {
		const { local_alias: alias } = serviceRequest;
		if (!alias) {
			logger.error(`No call identification received in the request.`);
			return null;
		}

		const identification = this.getIdentificationFromAlias(alias);

		return this.getServiceConfigurationForIdentification(identification);
	}

	private async getServiceConfigurationForIdentification(identification: string): Promise<ServiceConfiguration | null> {
		const call = await this.getCallByIdentification(identification);
		if (!call) {
			logger.error({ msg: 'Invalid call identification', identification });
			return null;
		}

		const conferenceTitle = 'title' in call && call.title;
		const title = conferenceTitle || 'Rocket.Chat';

		const [hostPin, guestPin] = await this.pexip.createAndStorePinsForCall(call);

		return this.makeServiceConfiguration(call._id, title, hostPin, guestPin);
	}

	private makeServiceConfiguration(name: string, title: string, hostPin: string, guestPin: string): ServiceConfiguration {
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
}
