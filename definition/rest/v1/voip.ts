import { IRegistrationInfo } from '../../voip/IRegistrationInfo';
import { VoipClientEvents } from '../../voip/VoipClientEvents';

export type VoipEndpoints = {
	'connector.extension.getRegistrationInfoByUserId': {
		GET: (params: { id: string }) => IRegistrationInfo;
	};

	'voip/events': {
		POST: (params: { event: VoipClientEvents; rid: string; comment?: string }) => void;
	};
};
