import { IRegistrationInfo } from '../../voip/IRegistrationInfo';

export type VoipEndpoints = {
	'connector.extension.getRegistrationInfoByUserId': {
		GET: (params: { id: string }) => IRegistrationInfo;
	};

	'voip/events': {
		POST: (params: { event: string; rid: string; comment?: string }) => void;
	};
};
