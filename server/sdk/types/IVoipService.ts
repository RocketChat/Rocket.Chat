import {
	IVoipCallServerConfig,
	IVoipManagementServerConfig,
	IVoipServerConfigBase,
	ServerType,
} from '../../../definition/IVoipServerConfig';
import { CommandHandler } from '../../services/voip/connector/asterisk/CommandHandler';
import { IVoipConnectorResult } from '../../../definition/IVoipConnectorResult';
import { IRoom } from '../../../definition/IRoom';
import { IUser } from '../../../definition/IUser';
import { IRegistrationInfo } from '../../../definition/voip/IRegistrationInfo';
import { VoipClientEvents } from '../../../definition/voip/VoipClientEvents';

export interface IVoipService {
	getServerConfigData(serverType: ServerType): IVoipCallServerConfig | IVoipManagementServerConfig;
	addServerConfigData(config: Omit<IVoipServerConfigBase, '_id' | '_updatedAt'>): Promise<boolean>;
	updateServerConfigData(config: Omit<IVoipServerConfigBase, '_id' | '_updatedAt'>): Promise<boolean>;
	deactivateServerConfigDataIfAvailable(serverType: ServerType): Promise<boolean>;
	getConnector(): CommandHandler;
	getConnectorVersion(): string;
	getQueueSummary(): Promise<IVoipConnectorResult>;
	getQueuedCallsForThisExtension(requestParams: any): Promise<IVoipConnectorResult>;
	getExtensionList(): Promise<IVoipConnectorResult>;
	getExtensionDetails(requestParams: any): Promise<IVoipConnectorResult>;
	handleEvent(event: VoipClientEvents, room: IRoom, user: IUser, comment?: string): Promise<void>;
	getRegistrationInfo(requestParams: any): Promise<{ result: IRegistrationInfo }>; // TODO: Check the reason behind IVoipConnectorResult
	cachedQueueDetails(): () => Promise<{ name: string; members: string[] }[]>;
}
