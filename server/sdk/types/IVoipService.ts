import { IVoipServerConfigBase, ServerType } from '../../../definition/IVoipServerConfig';
import { CommandHandler } from '../../services/voip/connector/asterisk/CommandHandler';
import { IVoipConnectorResult } from '../../../definition/IVoipConnectorResult';
import { IRegistrationInfo } from '../../../definition/voip/IRegistrationInfo';

export interface IVoipService {
	getConfiguration(): any;
	getServerConfigData(serverType: ServerType): IVoipServerConfigBase | null;
	addServerConfigData(config: Omit<IVoipServerConfigBase, '_id' | '_updatedAt'>): Promise<boolean>;
	updateServerConfigData(config: Omit<IVoipServerConfigBase, '_id' | '_updatedAt'>): Promise<boolean>;
	deactivateServerConfigDataIfAvailable(serverType: ServerType): Promise<boolean>;
	getConnector(): CommandHandler;
	getConnectorVersion(): string;
	getQueueSummary(): Promise<IVoipConnectorResult>;
	getQueuedCallsForThisExtension(requestParams: any): Promise<IVoipConnectorResult>;
	getExtensionList(): Promise<IVoipConnectorResult>;
	getExtensionDetails(requestParams: any): Promise<IVoipConnectorResult>;
	getRegistrationInfo(requestParams: any): Promise<{ result: IRegistrationInfo }>; // TODO: Check the reason behind IVoipConnectorResult
	cachedQueueDetails(): () => Promise<{ name: string; members: string[] }[]>;
}
