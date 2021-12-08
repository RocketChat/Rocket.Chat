import { IOmnichannelVoipServiceResult } from '../../../definition/ILivechatVoipServiceResult';

export interface IOmnichannelVoipService {
	getConfiguration(): any;
	getFreeExtensions(): Promise<IOmnichannelVoipServiceResult> ;
	getExtensionAllocationDetails(): Promise<IOmnichannelVoipServiceResult>;
}
