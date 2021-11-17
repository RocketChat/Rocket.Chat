import { IOmnichannelVoipServiceResult } from '../../../definition/ILivechatVoipServiceResult';

export interface IOmnichannelVoipService {
	getConfiguration(): any;
	getAvailableExtensions(): Promise<IOmnichannelVoipServiceResult> ;
	getExtensionAllocationDetails(): Promise<IOmnichannelVoipServiceResult>;
}
