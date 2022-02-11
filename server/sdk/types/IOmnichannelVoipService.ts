import { IOmnichannelVoipServiceResult } from '../../../definition/IOmnichannelVoipServiceResult';
import { IVoipExtensionBase } from '../../../definition/IVoipExtension';

export interface IOmnichannelVoipService {
	getConfiguration(): any;
	getFreeExtensions(): Promise<IOmnichannelVoipServiceResult>;
	getExtensionAllocationDetails(): Promise<IOmnichannelVoipServiceResult>;
	getExtensionListWithAgentData(): Promise<IVoipExtensionBase[]>;
}
