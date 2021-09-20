import { IVoipServerConfig, ServerType } from '../../../definition/IVoipServerConfig';

export interface IVoipService {
	getConfiguration(): any;
	getServerConfigData(serverType: ServerType): Promise<IVoipServerConfig | null>;
}
