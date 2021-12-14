import { IRegistrationInfo } from '../../voip/IRegistrationInfo';

export type VoipEndpoints = {
	'connector.extension.getRegistrationInfo': {
		GET: (params: { extension: string }) => IRegistrationInfo;
	};
};
