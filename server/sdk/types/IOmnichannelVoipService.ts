import { IOmnichannelVoipServiceResult } from '../../../definition/IOmnichannelVoipServiceResult';

export interface IOmnichannelVoipService {
	getConfiguration(): any;
	getFreeExtensions(): Promise<IOmnichannelVoipServiceResult>;
	getExtensionAllocationDetails(): Promise<IOmnichannelVoipServiceResult>;
}
