import { ServerType } from '../../../definition/IVoipServerConfig';
import { CommandHandler } from '../../services/voip/connector/asterisk/CommandHandler';
import { IVoipConnectorResult } from '../../../definition/IVoipConnectorResult';
import { IRegistrationInfo } from '../../../definition/voip/IRegistrationInfo';

export interface IVoipService {
	getConfiguration(): any;
	deactivateServerConfigDataIfAvailable(serverType: ServerType): Promise<boolean>;
	getConnector(): Promise<CommandHandler>;
	getConnectorVersion(): Promise<string>;
	getQueueSummary(): Promise<IVoipConnectorResult>;
	getSourceQueueDetails(requestParams: any): Promise<IVoipConnectorResult>;
	getQueuedCallsForThisExtension(requestParams: any): Promise<IVoipConnectorResult>;
	getExtensionList(): Promise<IVoipConnectorResult>;
	getExtensionDetails(requestParams: any): Promise<IVoipConnectorResult>;
	getRegistrationInfo(requestParams: any): Promise<{ result: IRegistrationInfo }>; // TODO: Check the reason behind IVoipConnectorResult
}
