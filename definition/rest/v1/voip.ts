import { IQueueDetails, IQueueSummary } from '../../ACDQueues';
import { IVoipExtensionBase, IVoipExtensionConfig, IRegistrationInfo } from '../../IVoipExtension';
import { IVoipServerConfig } from '../../IVoipServerConfig';

type ServerConfigManagementParms = {
	host: string;
	port: number;
	serverName: string;
	username: string;
	password: string;
};

export type VoipEndpoints = {
	'connector.getVersion': {
		GET: () => string;
	};
	'connector.extension.list': {
		GET: () => { extensions: IVoipExtensionBase[] };
	};
	'connector.extension.getDetails': {
		GET: (params: { extension: string }) => IVoipExtensionConfig;
	};
	'connector.extension.getRegistrationInfo': {
		GET: (params: { extension: string }) => IRegistrationInfo;
	};
	'voip/queues.getSummary': {
		GET: () => { summary: IQueueSummary[] };
	};
	'voip/queues.getQueuedCallsForThisExtension': {
		GET: (params: { extension: string }) => IQueueDetails;
	};
	'voip/serverConfig/management': {
		GET: () => IVoipServerConfig;
		POST: (params: ServerConfigManagementParms) => void;
	};
};
