import { IVoipServerConfig, ServerType } from '../../../definition/IVoipServerConfig';
import { CommandHandler } from '../../services/voip/connector/asterisk/CommandHandler';
import { IVoipConnectorResult } from '../../../definition/IVoipConnectorResult';
import { IRoom } from '../../../definition/IRoom';
import { IUser } from '../../../definition/IUser';

export interface IVoipService {
	getConfiguration(): any;
	getServerConfigData(serverType: ServerType): Promise<IVoipServerConfig | null>;
	addServerConfigData(config: Omit<IVoipServerConfig, '_id' | '_updatedAt'>): Promise<boolean>;
	updateServerConfigData(config: Omit<IVoipServerConfig, '_id' | '_updatedAt'>): Promise<boolean>;
	deactivateServerConfigDataIfAvailable(serverType: ServerType): Promise<boolean>;
	getConnector(): Promise<CommandHandler>;
	getConnectorVersion(): Promise<string>;
	getQueueSummary(): Promise<IVoipConnectorResult>;
	getQueuedCallsForThisExtension(requestParams: any): Promise<IVoipConnectorResult>;
	getExtensionList(): Promise<IVoipConnectorResult>;
	getExtensionDetails(requestParams: any): Promise<IVoipConnectorResult>;
	getRegistrationInfo(requestParams: any): Promise<IVoipConnectorResult>;
	// change IRoom for IVoipRoom
	handleEvent(event: string, room: IRoom, user: IUser, comment?: string): Promise<void>;
}
