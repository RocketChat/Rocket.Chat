import { IRegistrationInfo } from '../../../client/components/voip/IRegistrationInfo';

export type VoipEndpoints = {
	'connector.extension.getRegistrationInfo': {
		GET: (params: { extention: string }) => IRegistrationInfo;
	};
};
