import { IVoipServerConfig, ServerType } from '../../../definition/IVoipServerConfig';

export interface IVoipService {
	getConfiguration(): any;
	getServerConfigData(serverType: ServerType): Promise<IVoipServerConfig | null>;
	addServerConfigData(config: Omit<IVoipServerConfig, '_id' | '_updatedAt'>): Promise<boolean>;
	updateServerConfigData(config: Omit<IVoipServerConfig, '_id' | '_updatedAt'>): Promise<boolean>;
	deactivateServerConfigDataIfAvailable(serverType: ServerType): Promise<boolean>;
}
