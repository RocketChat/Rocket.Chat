import { IRegistrationInfo } from '../../voip/IRegistrationInfo';

export type VoipEndpoints = {
	'connector.extension.getRegistrationInfoByUserId': {
		GET: (params: { id: string }) => IRegistrationInfo;
	};
};
